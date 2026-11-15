import React, { useState } from 'react';
import { Bookmark, RefreshCw } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { generateCaptionsApi } from '../../services/aiClient';
import type { CaptionVariation } from '../../types/ideonix';
import {
  CopyTextButton,
  GlassButton,
  GlassCard,
  inputClassName,
  labelClassName,
  PrimaryButton,
} from '../../components/ui/GlassPrimitives';

const SAMPLE_CAPTIONS: CaptionVariation[] = [
  {
    style: 'Engaging',
    caption:
      'Most creators think they need a new lens when all they really need is one darker wall and a side lamp.',
    hashtags: ['#FilmmakingTips', '#CreatorStudio', '#LightingSetup', '#VideoProduction'],
    cta: 'Drop "SETUP" below if you want the exact lamp angle.',
  },
  {
    style: 'Short',
    caption: 'Kill the overhead light. Turn on one side lamp. Watch your footage transform.',
    hashtags: ['#StudioLighting', '#ReelsTips'],
    cta: 'Save before your next shoot.',
  },
  {
    style: 'Professional',
    caption:
      'Consistent framing and controlled negative fill reduce post-production color grading time by half.',
    hashtags: ['#ContentWorkflow', '#VideoStrategy', '#ProductionTips'],
    cta: 'Bookmark this framework for your studio SOP.',
  },
  {
    style: 'Funny',
    caption: 'My ceiling bulb watching me unplug it for the 40th time to pretend I own a cinema studio.',
    hashtags: ['#CreatorLife', '#SoloFilmmaker'],
    cta: 'Tag a friend still filming under kitchen fluorescents.',
  },
  {
    style: 'Emotional',
    caption:
      'You do not need expensive gear to start telling honest stories. Work with the room you already have.',
    hashtags: ['#CreativeJourney', '#IndieCreator'],
    cta: 'Tell me what you are filming this week.',
  },
];

export function CaptionStudioPage() {
  const { brandVoice, saveLibraryItem, recordActivity, notify } = useWorkspace();

  const [topic, setTopic] = useState('One-light small room studio setup');
  const [context, setContext] = useState('Demonstrating how turning off overhead room lights creates depth.');
  const [platform, setPlatform] = useState('Instagram');
  const [language, setLanguage] = useState('English');

  const [variations, setVariations] = useState<CaptionVariation[]>([]);
  const [isSample, setIsSample] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;
    if (!topic.trim()) {
      setError('Topic is required.');
      return;
    }

    setLoading(true);
    setError(null);
    setIsSample(false);
    try {
      const result = await generateCaptionsApi({
        topic: topic.trim(),
        context: context.trim(),
        platform,
        language,
        brandVoice,
      });
      setVariations(result);
      await recordActivity('captions', topic.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Caption generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    if (variations.length === 0) return;
    await saveLibraryItem({
      category: 'caption',
      title: `${topic} — Caption Pack`,
      summary: `${variations.length} variations (${variations.map((v) => v.style).join(', ')})`,
      platform,
      tags: ['captions', platform.toLowerCase()],
      payload: { topic, platform, variations },
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-5">
        <h1 className="text-2xl font-bold text-white">Caption Studio</h1>
        <p className="mt-1 text-sm text-[#b8bcd0]">
          Generate Engaging, Short, Professional, Funny, and Emotional caption variations with hashtags and CTAs.
        </p>
      </div>

      <GlassCard className="p-6">
        <form onSubmit={handleGenerate} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2">
            <label htmlFor="cap-topic" className={labelClassName}>Post Topic</label>
            <input
              id="cap-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className={inputClassName}
              required
            />
          </div>
          <div>
            <label htmlFor="cap-platform" className={labelClassName}>Platform</label>
            <select
              id="cap-platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className={inputClassName}
            >
              <option>Instagram</option>
              <option>YouTube</option>
              <option>LinkedIn</option>
              <option>Facebook</option>
              <option>X</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="cap-context" className={labelClassName}>Context / Script Summary</label>
            <textarea
              id="cap-context"
              rows={2}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="cap-lang" className={labelClassName}>Language</label>
            <input
              id="cap-lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={inputClassName}
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap items-center gap-3 pt-1">
            <PrimaryButton type="submit" loading={loading}>
              Generate 5 Variations
            </PrimaryButton>
            {variations.length > 0 && (
              <>
                <GlassButton onClick={() => handleGenerate()} loading={loading}>
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  <span>Regenerate</span>
                </GlassButton>
                <GlassButton onClick={handleSaveAll}>
                  <Bookmark className="h-4 w-4 text-violet-300" aria-hidden="true" />
                  <span>Save Caption Pack</span>
                </GlassButton>
              </>
            )}
            <GlassButton
              onClick={() => {
                setError(null);
                setVariations(SAMPLE_CAPTIONS);
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

      {variations.length === 0 ? (
        <GlassCard subtle className="p-10 text-center">
          <p className="text-sm font-medium text-white">No captions generated yet</p>
          <p className="mt-1 text-xs text-[#9ca2b8]">
            Enter a post topic above to receive 5 distinct tonal variations.
          </p>
        </GlassCard>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {variations.map((v, idx) => {
            const fullCopy = `${v.caption}\n\n${v.cta}\n\n${v.hashtags.join(' ')}`;
            return (
              <GlassCard key={`${v.style}_${idx}`} className="flex flex-col justify-between p-6">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#9ca2b8]">
                    <span className="font-semibold text-violet-300">{v.style}</span>
                    {isSample && <span className="text-amber-300">Sample data</span>}
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white">
                    {v.caption}
                  </p>
                  <p className="mt-3 text-xs font-medium text-violet-200">CTA: {v.cta}</p>
                  <p className="mt-2 font-mono text-xs text-[#9ca2b8]">{v.hashtags.join(' ')}</p>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4">
                  <CopyTextButton text={fullCopy} label="Copy Caption" />
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
