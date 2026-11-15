import React, { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { repurposeContentApi } from '../../services/aiClient';
import type { RepurposedVersion } from '../../types/ideonix';
import {
  CopyTextButton,
  GlassButton,
  GlassCard,
  inputClassName,
  labelClassName,
  PrimaryButton,
} from '../../components/ui/GlassPrimitives';

const SAMPLE_REPURPOSED: RepurposedVersion[] = [
  {
    platform: 'Instagram Reel',
    headline: 'Stop Over-Lighting Your Studio',
    content: 'HOOK: Kill your ceiling bulb right now.\n\nBODY: One 45-degree soft light + one dark wall gives instant contrast without spending $900 on kits.\n\nCTA: Save this before your next shoot.',
    structureNotes: 'Punchy 3-beat vertical script under 110 words.',
    hashtags: ['#StudioLighting', '#ReelsTips'],
  },
  {
    platform: 'YouTube Shorts',
    headline: 'The 1-Light Trick Pros Use',
    content: 'Visual: Overhead light off -> key light on.\nLine: Contrast makes cheap cameras look cinematic. Put black foam opposite your light and keep your ceiling dark.',
    structureNotes: 'Fast 35-second visual loop format.',
    hashtags: ['#YouTubeShorts', '#Filmmaking'],
  },
  {
    platform: 'YouTube Description',
    headline: 'How to Light a Small Studio With One Light',
    content: 'In this breakdown, we cover why overhead room lights flatten video depth, how to position a 45-degree key light, and how negative fill adds contrast for free.\n\n00:00 Why room lights flatten video\n00:12 45-degree key placement\n00:28 Negative fill trick',
    structureNotes: 'Search-indexed summary + timestamps.',
    hashtags: ['#VideoLighting', '#StudioSetup'],
  },
  {
    platform: 'Facebook',
    headline: 'A simple studio lighting fix you can try tonight',
    content: 'Before buying new lights, try turning off the overhead ceiling fixture and placing one soft lamp 45 degrees to your side. The shadows on the opposite cheek add instant depth.',
    structureNotes: 'Conversational community story post.',
    hashtags: ['#CreatorCommunity'],
  },
  {
    platform: 'LinkedIn',
    headline: 'Why contrast matters more than gear budget in creator video',
    content: 'Teams often over-spend on multi-light kits before fixing light direction.\n\nThree fast rules for crisp video calls & social clips:\n1. Kill overhead bounce\n2. Angle one key light 45°\n3. Use dark fill on the shadow side',
    structureNotes: 'Scannable executive bullet structure.',
    hashtags: ['#VideoMarketing', '#ContentProduction'],
  },
  {
    platform: 'X',
    headline: '1-light rule thread',
    content: 'Cheap cameras look cinematic when you control shadows.\n\nTurn off the ceiling bulb. Put one soft light at 45°. Leave the other side dark.\n\nDepth > brightness.',
    structureNotes: 'Crisp under-220-char high-contrast post.',
    hashtags: [],
  },
];

export function RepurposerPage() {
  const { brandVoice, saveLibraryItem, recordActivity, notify } = useWorkspace();

  const [sourceText, setSourceText] = useState(
    'Most creators think flat video comes from a cheap camera, when it actually comes from overhead ceiling lighting. Turn off the room bulb, place a single soft light 45 degrees off camera, and keep the opposite wall dark for natural shadow contrast.'
  );
  const [goal, setGoal] = useState('Adapt cleanly across short-form video and written feeds');
  const [versions, setVersions] = useState<RepurposedVersion[]>([]);
  const [isSample, setIsSample] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRepurpose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (sourceText.trim().length < 20) {
      setError('Paste at least a short paragraph or script (20+ characters).');
      return;
    }

    setLoading(true);
    setError(null);
    setIsSample(false);
    try {
      const result = await repurposeContentApi({
        sourceText: sourceText.trim(),
        goal: goal.trim(),
        brandVoice,
      });
      setVersions(result);
      await recordActivity('repurposer', sourceText.trim().slice(0, 50));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Repurposing failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePack = async () => {
    if (versions.length === 0) return;
    await saveLibraryItem({
      category: 'repurpose',
      title: `Repurposed Pack: ${sourceText.trim().slice(0, 48)}...`,
      summary: `${versions.length} native platform adaptations`,
      platform: 'Multi-platform',
      tags: ['repurpose', 'omnichannel'],
      payload: { sourceText, versions },
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-5">
        <h1 className="text-2xl font-bold text-white">Content Repurposer</h1>
        <p className="mt-1 text-sm text-[#b8bcd0]">
          Turn one script or article into native versions for Instagram Reel, YouTube Shorts, YouTube Description, Facebook, LinkedIn, and X.
        </p>
      </div>

      <GlassCard className="p-6">
        <form onSubmit={handleRepurpose} className="space-y-4">
          <div>
            <label htmlFor="rep-source" className={labelClassName}>Source Script or Article</label>
            <textarea
              id="rep-source"
              rows={5}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              className={inputClassName}
              placeholder="Paste a script, newsletter, or article..."
              required
            />
          </div>
          <div>
            <label htmlFor="rep-goal" className={labelClassName}>Distribution Goal</label>
            <input
              id="rep-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className={inputClassName}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton type="submit" loading={loading}>
              Repurpose Across 6 Platforms
            </PrimaryButton>
            {versions.length > 0 && (
              <GlassButton onClick={handleSavePack}>
                <Bookmark className="h-4 w-4 text-violet-300" aria-hidden="true" />
                <span>Save All Versions</span>
              </GlassButton>
            )}
            <GlassButton
              onClick={() => {
                setError(null);
                setVersions(SAMPLE_REPURPOSED);
                setIsSample(true);
                notify('Loaded clearly labeled Sample data.');
              }}
            >
              Load Sample Data
            </GlassButton>
          </div>
        </form>

        {error && (
          <div role="alert" className="mt-4 rounded-xl border border-rose-400/35 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
            {error}
          </div>
        )}
      </GlassCard>

      {versions.length === 0 ? (
        <GlassCard subtle className="p-10 text-center">
          <p className="text-sm font-medium text-white">No repurposed versions yet</p>
          <p className="mt-1 text-xs text-[#9ca2b8]">
            Paste your source content above to adapt tone, length, and structure for all 6 channels.
          </p>
        </GlassCard>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {versions.map((ver, idx) => (
            <GlassCard key={`${ver.platform}_${idx}`} className="flex flex-col justify-between p-6">
              <div>
                <div className="flex items-center justify-between text-xs text-[#9ca2b8]">
                  <span className="font-semibold text-violet-300">{ver.platform}</span>
                  {isSample && <span className="text-amber-300">Sample data</span>}
                </div>
                <h2 className="mt-2 text-base font-semibold text-white">{ver.headline}</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[#d9dce8]">
                  {ver.content}
                </p>
                <p className="mt-3 text-xs text-[#9ca2b8]">Structure: {ver.structureNotes}</p>
                {ver.hashtags?.length > 0 && (
                  <p className="mt-2 font-mono text-xs text-violet-300/80">
                    {ver.hashtags.join(' ')}
                  </p>
                )}
              </div>

              <div className="mt-4 border-t border-white/10 pt-4">
                <CopyTextButton
                  text={`${ver.headline}\n\n${ver.content}${
                    ver.hashtags?.length ? `\n\n${ver.hashtags.join(' ')}` : ''
                  }`}
                />
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
