import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { repurposeContentApi } from '../../services/aiClient';
import type { RepurposedVersion } from '../../types/ideonix';
import {
  CopyTextButton,
  GlassCard,
  inputClassName,
  labelClassName,
  PrimaryButton,
  ResultsSkeleton,
  SaveActionButton,
  StaggerGroup,
} from '../../components/ui/GlassPrimitives';

export function RepurposerPage() {
  const { brandVoice, saveLibraryItem, recordActivity } = useWorkspace();

  const [sourceText, setSourceText] = useState(
    'Most creators think flat video comes from a cheap camera, when it actually comes from overhead ceiling lighting. Turn off the room bulb, place a single soft light 45 degrees off camera, and keep the opposite wall dark for natural shadow contrast.'
  );
  const [goal, setGoal] = useState('Adapt cleanly across short-form video and written feeds');
  const [versions, setVersions] = useState<RepurposedVersion[]>([]);
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
      <div className="border-b border-white/15 pb-5">
        <h1 className="text-2xl font-bold text-white">Content Repurposer</h1>
        <p className="mt-1 text-sm text-neutral-300">
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
              <SaveActionButton
                onSave={handleSavePack}
                label="Save All Versions"
                savedLabel="Saved All"
                className="!min-h-[44px]"
              />
            )}
          </div>
        </form>

        {error && (
          <div role="alert" className="glass mt-4 rounded-xl !border-white/35 !bg-white/10 px-4 py-3 text-xs text-white">
            {error}
          </div>
        )}
      </GlassCard>

      {loading ? (
        <ResultsSkeleton variant="cards" count={6} />
      ) : versions.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <p className="text-sm font-medium text-white">No repurposed versions yet</p>
          <p className="mt-1 text-xs text-neutral-400">
            Paste your source content above to adapt tone, length, and structure for all 6 channels.
          </p>
        </GlassCard>
      ) : (
        <StaggerGroup className="grid gap-5 md:grid-cols-2">
          {versions.map((ver, idx) => (
            <GlassCard key={`${ver.platform}_${idx}`} className="flex flex-col justify-between p-6">
              <div>
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span className="font-semibold text-white">{ver.platform}</span>
                </div>
                <h2 className="mt-2 text-base font-semibold text-white">{ver.headline}</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-neutral-200">
                  {ver.content}
                </p>
                <p className="mt-3 text-xs text-neutral-400">Structure: {ver.structureNotes}</p>
                {ver.hashtags?.length > 0 && (
                  <p className="mt-2 font-mono text-xs text-neutral-300">
                    {ver.hashtags.join(' ')}
                  </p>
                )}
              </div>

              <div className="mt-4 border-t border-white/15 pt-4">
                <CopyTextButton
                  text={`${ver.headline}\n\n${ver.content}${
                    ver.hashtags?.length ? `\n\n${ver.hashtags.join(' ')}` : ''
                  }`}
                />
              </div>
            </GlassCard>
          ))}
        </StaggerGroup>
      )}
    </div>
  );
}
