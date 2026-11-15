import React, { useState } from 'react';
import { motion } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { generateIdeasApi } from '../../services/aiClient';
import type { GeneratedIdea } from '../../types/ideonix';
import { MOTION_EASING, useMotionSettings } from '../../config/motion';
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

export function IdeaGeneratorPage() {
  const { brandVoice, saveLibraryItem, recordActivity } = useWorkspace();
  const { durations } = useMotionSettings();

  const [niche, setNiche] = useState('Video Creation & Editing');
  const [topic, setTopic] = useState('How solo creators can double watch-time without fancy gear');
  const [audience, setAudience] = useState('Beginner Instagram & YouTube creators');
  const [platform, setPlatform] = useState('Instagram Reels');
  const [style, setStyle] = useState('Practical Storytelling');
  const [language, setLanguage] = useState('English');
  const [count, setCount] = useState(4);

  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;
    if (!niche.trim() || !topic.trim() || !audience.trim()) {
      setError('Niche, Topic, and Target Audience are required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await generateIdeasApi({
        niche: niche.trim(),
        topic: topic.trim(),
        audience: audience.trim(),
        platform,
        style,
        language,
        count,
        brandVoice,
      });
      setIdeas(result);
      await recordActivity('ideas', topic.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate ideas.');
    } finally {
      setLoading(false);
    }
  };

  const updateIdeaField = (id: string, field: keyof GeneratedIdea, value: string) => {
    setIdeas((prev) => prev.map((idea) => (idea.id === id ? { ...idea, [field]: value } : idea)));
  };

  const handleSaveIdea = async (idea: GeneratedIdea) => {
    await saveLibraryItem({
      category: 'idea',
      title: idea.title,
      summary: idea.description,
      platform,
      tags: [niche.toLowerCase().slice(0, 30), platform.toLowerCase().slice(0, 30)],
      payload: idea as unknown as Record<string, unknown>,
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-white/15 pb-5">
        <h1 className="text-2xl font-bold text-white">AI Idea Generator</h1>
        <p className="mt-1 text-sm text-neutral-300">
          Generate structured hooks, formats, audience relevance, and CTAs aligned with your{' '}
          <span className="font-medium text-white">{brandVoice.preset}</span> voice.
        </p>
      </div>

      <GlassCard className="p-6">
        <form onSubmit={handleGenerate} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="idea-niche" className={labelClassName}>Niche</label>
            <input
              id="idea-niche"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className={inputClassName}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="idea-topic" className={labelClassName}>Core Topic</label>
            <input
              id="idea-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className={inputClassName}
              required
            />
          </div>
          <div>
            <label htmlFor="idea-audience" className={labelClassName}>Target Audience</label>
            <input
              id="idea-audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className={inputClassName}
              required
            />
          </div>

          <div>
            <label htmlFor="idea-platform" className={labelClassName}>Platform</label>
            <GlassSelect
              id="idea-platform"
              value={platform}
              onChange={setPlatform}
              options={['Instagram Reels', 'YouTube Shorts', 'YouTube Long-form', 'LinkedIn', 'X']}
            />
          </div>
          <div>
            <label htmlFor="idea-style" className={labelClassName}>Style</label>
            <input
              id="idea-style"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="idea-lang" className={labelClassName}>Language</label>
            <input
              id="idea-lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="idea-count" className={labelClassName}>Idea Count</label>
            <GlassSelect
              id="idea-count"
              value={String(count)}
              onChange={(v) => setCount(Number(v))}
              options={[3, 4, 5, 6, 8].map((n) => ({
                value: String(n),
                label: `${n} ideas`,
              }))}
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-3 pt-2">
            <PrimaryButton type="submit" loading={loading}>
              Generate Ideas
            </PrimaryButton>
            {ideas.length > 0 && (
              <GlassButton onClick={() => handleGenerate()} loading={loading}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                <span>Regenerate</span>
              </GlassButton>
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
        <ResultsSkeleton variant="cards" count={count} />
      ) : ideas.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <p className="text-sm font-medium text-white">No generated ideas yet</p>
          <p className="mt-1 text-xs text-neutral-400">
            Fill out your niche and topic above and click Generate Ideas.
          </p>
        </GlassCard>
      ) : (
        <StaggerGroup className="grid gap-5 md:grid-cols-2">
          {ideas.map((idea) => {
            const isEditing = editingId === idea.id;
            const formattedCopy = `${idea.title}\n\nHook: ${idea.hook}\nFormat: ${idea.format}\nDescription: ${idea.description}\nAudience Fit: ${idea.audienceRelevance}\nCTA: ${idea.cta}`;

            return (
              <GlassCard key={idea.id} className="flex flex-col justify-between p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-xs text-neutral-400">
                    <span>{idea.format} · {platform}</span>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        aria-label="Edit idea title"
                        value={idea.title}
                        onChange={(e) => updateIdeaField(idea.id, 'title', e.target.value)}
                        className={inputClassName}
                      />
                      <textarea
                        aria-label="Edit idea hook"
                        rows={2}
                        value={idea.hook}
                        onChange={(e) => updateIdeaField(idea.id, 'hook', e.target.value)}
                        className={inputClassName}
                      />
                      <textarea
                        aria-label="Edit idea description"
                        rows={3}
                        value={idea.description}
                        onChange={(e) => updateIdeaField(idea.id, 'description', e.target.value)}
                        className={inputClassName}
                      />
                      <input
                        aria-label="Edit idea CTA"
                        value={idea.cta}
                        onChange={(e) => updateIdeaField(idea.id, 'cta', e.target.value)}
                        className={inputClassName}
                      />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-lg font-semibold text-white">{idea.title}</h2>
                      <p className="text-sm text-neutral-300">{idea.description}</p>
                      <div className="space-y-1.5 border-t border-white/15 pt-3 text-xs leading-relaxed">
                        <p>
                          <span className="font-semibold text-white">Hook: </span>
                          <span className="text-neutral-200">{idea.hook}</span>
                        </p>
                        <p>
                          <span className="font-semibold text-white">Relevance: </span>
                          <span className="text-neutral-300">{idea.audienceRelevance}</span>
                        </p>
                        <p>
                          <span className="font-semibold text-white">CTA: </span>
                          <span className="text-neutral-300">{idea.cta}</span>
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/15 pt-4">
                  <motion.button
                    type="button"
                    onClick={() => setEditingId(isEditing ? null : idea.id)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: durations.fast, ease: MOTION_EASING.out }}
                    className="glass min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-300 transition-[color,filter] hover:brightness-110 hover:text-white"
                  >
                    {isEditing ? 'Done' : 'Edit'}
                  </motion.button>
                  <CopyTextButton text={formattedCopy} />
                  <SaveActionButton
                    onSave={() => handleSaveIdea(idea)}
                    label="Save to Library"
                    savedLabel="Saved"
                    className="!min-h-[36px] !rounded-lg !border-white/30 !bg-white/12 !px-3 !py-1.5"
                  />
                </div>
              </GlassCard>
            );
          })}
        </StaggerGroup>
      )}
    </div>
  );
}
