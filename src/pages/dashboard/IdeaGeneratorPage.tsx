import React, { useState } from 'react';
import { Bookmark, RefreshCw } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { generateIdeasApi } from '../../services/aiClient';
import type { GeneratedIdea } from '../../types/ideonix';
import {
  CopyTextButton,
  GlassButton,
  GlassCard,
  inputClassName,
  labelClassName,
  PrimaryButton,
} from '../../components/ui/GlassPrimitives';

const SAMPLE_IDEAS: GeneratedIdea[] = [
  {
    id: 'sample_idea_1',
    title: 'The 3-Second Audio Rule Most Reels Ignore',
    description:
      'Compare raw camera mic audio against a clipped lapel mic in the exact same room to prove why audio drives retention.',
    hook: 'People will forgive blurry video—they will mute bad audio in two seconds.',
    format: '40s Side-by-Side Audio Test',
    audienceRelevance: 'Solves instant drop-off for creators filming at home.',
    cta: 'Comment "MIC" if you want my under-$50 desk audio chain.',
  },
  {
    id: 'sample_idea_2',
    title: 'How I Plan 5 Videos in 35 Minutes on Sunday',
    description:
      'Screen-record a batching checklist moving from single topic pillar to hooks, shoot list, and calendar dates.',
    hook: 'Stop opening a blank timeline on Monday morning.',
    format: 'Over-the-shoulder screen breakdown',
    audienceRelevance: 'Gives overwhelmed creators a repeatable weekly habit.',
    cta: 'Save this workflow before next week starts.',
  },
];

export function IdeaGeneratorPage() {
  const { brandVoice, saveLibraryItem, recordActivity, notify } = useWorkspace();

  const [niche, setNiche] = useState('Video Creation & Editing');
  const [topic, setTopic] = useState('How solo creators can double watch-time without fancy gear');
  const [audience, setAudience] = useState('Beginner Instagram & YouTube creators');
  const [platform, setPlatform] = useState('Instagram Reels');
  const [style, setStyle] = useState('Practical Storytelling');
  const [language, setLanguage] = useState('English');
  const [count, setCount] = useState(4);

  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [isSample, setIsSample] = useState(false);
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
    setIsSample(false);
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
      <div className="border-b border-white/10 pb-5">
        <h1 className="text-2xl font-bold text-white">AI Idea Generator</h1>
        <p className="mt-1 text-sm text-[#b8bcd0]">
          Generate structured hooks, formats, audience relevance, and CTAs aligned with your{' '}
          <span className="text-violet-300">{brandVoice.preset}</span> voice.
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
            <select
              id="idea-platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className={inputClassName}
            >
              <option>Instagram Reels</option>
              <option>YouTube Shorts</option>
              <option>YouTube Long-form</option>
              <option>LinkedIn</option>
              <option>X</option>
            </select>
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
            <select
              id="idea-count"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className={inputClassName}
            >
              {[3, 4, 5, 6, 8].map((n) => (
                <option key={n} value={n}>{n} ideas</option>
              ))}
            </select>
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
            <GlassButton
              onClick={() => {
                setError(null);
                setIdeas(SAMPLE_IDEAS);
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

      {ideas.length === 0 ? (
        <GlassCard subtle className="p-10 text-center">
          <p className="text-sm font-medium text-white">No generated ideas yet</p>
          <p className="mt-1 text-xs text-[#9ca2b8]">
            Fill out your niche and topic above and click Generate Ideas.
          </p>
        </GlassCard>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {ideas.map((idea) => {
            const isEditing = editingId === idea.id;
            const formattedCopy = `${idea.title}\n\nHook: ${idea.hook}\nFormat: ${idea.format}\nDescription: ${idea.description}\nAudience Fit: ${idea.audienceRelevance}\nCTA: ${idea.cta}`;

            return (
              <GlassCard key={idea.id} className="flex flex-col justify-between p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-xs text-[#9ca2b8]">
                    <span>{idea.format} · {platform}</span>
                    {isSample && <span className="font-medium text-amber-300">Sample data</span>}
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
                      <p className="text-sm text-[#b8bcd0]">{idea.description}</p>
                      <div className="space-y-1.5 border-t border-white/10 pt-3 text-xs leading-relaxed">
                        <p>
                          <span className="font-semibold text-violet-300">Hook: </span>
                          <span className="text-white">{idea.hook}</span>
                        </p>
                        <p>
                          <span className="font-semibold text-violet-300">Relevance: </span>
                          <span className="text-[#b8bcd0]">{idea.audienceRelevance}</span>
                        </p>
                        <p>
                          <span className="font-semibold text-violet-300">CTA: </span>
                          <span className="text-[#b8bcd0]">{idea.cta}</span>
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingId(isEditing ? null : idea.id)}
                    className="min-h-[36px] rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-[#b8bcd0] hover:bg-white/[0.1] hover:text-white"
                  >
                    {isEditing ? 'Done' : 'Edit'}
                  </button>
                  <CopyTextButton text={formattedCopy} />
                  <button
                    type="button"
                    onClick={() => handleSaveIdea(idea)}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-violet-600/25 border border-violet-400/30 px-3 py-1.5 text-xs font-medium text-violet-200 hover:bg-violet-600/40"
                  >
                    <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Save to Library</span>
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
