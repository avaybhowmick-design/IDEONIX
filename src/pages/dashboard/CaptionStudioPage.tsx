import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { generateCaptionsApi } from '../../services/aiClient';
import type { CaptionVariation } from '../../types/ideonix';
import {
  CopyTextButton,
  GlassButton,
  GlassCard,
  GlassSelect,
  inputClassName,
  labelClassName,
  PrimaryButton,
  ResultsSkeleton,
  SaveActionButton,
  StaggerGroup,
} from '../../components/ui/GlassPrimitives';

export function CaptionStudioPage() {
  const { brandVoice, saveLibraryItem, recordActivity } = useWorkspace();

  const [topic, setTopic] = useState('One-light small room studio setup');
  const [context, setContext] = useState('Demonstrating how turning off overhead room lights creates depth.');
  const [platform, setPlatform] = useState('Instagram');
  const [language, setLanguage] = useState('English');

  const [variations, setVariations] = useState<CaptionVariation[]>([]);
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
      <div className="border-b border-white/15 pb-5">
        <h1 className="text-2xl font-bold text-white">Caption Studio</h1>
        <p className="mt-1 text-sm text-neutral-300">
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
            <GlassSelect
              id="cap-platform"
              value={platform}
              onChange={setPlatform}
              options={['Instagram', 'YouTube', 'LinkedIn', 'Facebook', 'X']}
            />
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
                <SaveActionButton
                  onSave={handleSaveAll}
                  label="Save Caption Pack"
                  savedLabel="Saved Pack"
                  className="!min-h-[44px]"
                />
              </>
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
        <ResultsSkeleton variant="cards" count={4} />
      ) : variations.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <p className="text-sm font-medium text-white">No captions generated yet</p>
          <p className="mt-1 text-xs text-neutral-400">
            Enter a post topic above to receive 5 distinct tonal variations.
          </p>
        </GlassCard>
      ) : (
        <StaggerGroup className="grid gap-5 md:grid-cols-2">
          {variations.map((v, idx) => {
            const fullCopy = `${v.caption}\n\n${v.cta}\n\n${v.hashtags.join(' ')}`;
            return (
              <GlassCard key={`${v.style}_${idx}`} className="flex flex-col justify-between p-6">
                <div>
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span className="font-semibold text-white">{v.style}</span>
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white">
                    {v.caption}
                  </p>
                  <p className="mt-3 text-xs font-medium text-neutral-200">CTA: {v.cta}</p>
                  <p className="mt-2 font-mono text-xs text-neutral-400">{v.hashtags.join(' ')}</p>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-white/15 pt-4">
                  <CopyTextButton text={fullCopy} label="Copy Caption" />
                </div>
              </GlassCard>
            );
          })}
        </StaggerGroup>
      )}
    </div>
  );
}
