import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Bookmark, Info } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { analyzeViralApi } from '../../services/aiClient';
import type { ViralAnalysisResult } from '../../types/ideonix';
import {
  GlassButton,
  GlassCard,
  inputClassName,
  labelClassName,
  PrimaryButton,
} from '../../components/ui/GlassPrimitives';

const SAMPLE_VIRAL: ViralAnalysisResult = {
  overallScore: 84,
  summary:
    'Strong opening disruption and clear physical takeaway. Tightening the mid-section pacing and adding a concrete comment trigger will boost completion.',
  metrics: [
    {
      label: 'Hook Strength',
      score: 90,
      explanation: 'Challenges a common gear misconception in under 10 words.',
      fix: 'Show the lighting switch flicker immediately at 0.5s.',
    },
    {
      label: 'Relevance',
      score: 88,
      explanation: 'Directly addresses small-room creators.',
      fix: 'Mention bedroom/home-office size explicitly.',
    },
    {
      label: 'Clarity',
      score: 86,
      explanation: 'Single rule (45° light + dark wall) is easy to retain.',
      fix: 'Overlay the exact 45-degree angle number on screen.',
    },
    {
      label: 'Engagement',
      score: 79,
      explanation: 'Solid save intent, moderate comment prompt.',
      fix: 'Ask viewers which room setup obstacle they hit first.',
    },
    {
      label: 'Storytelling',
      score: 81,
      explanation: 'Clean problem-contrast-solution arc.',
      fix: 'Show a 1-second bad footage example before the fix.',
    },
    {
      label: 'CTA',
      score: 78,
      explanation: 'Clear save ask, could add a keyword reply.',
      fix: 'End with: Save this rule before your next shoot.',
    },
    {
      label: 'Structure',
      score: 87,
      explanation: 'Tight 3-beat cadence under 45 seconds.',
      fix: 'Cut breath gaps between sentences 2 and 3.',
    },
  ],
  topFixes: [
    'Display the before/after visual contrast in frame 1.',
    'Add a 45-degree angle overlay during the explanation.',
    'Tighten the closing CTA to one specific action.',
  ],
  disclaimer: 'AI-generated estimate, not a prediction or guarantee of virality.',
};

export function ViralAnalyzerPage() {
  const { brandVoice, saveLibraryItem, recordActivity, notify } = useWorkspace();

  const [title, setTitle] = useState('One-Light Desk Setup That Looks Like a Studio');
  const [platform, setPlatform] = useState('Instagram Reels');
  const [audience, setAudience] = useState('Solo creators filming at home');
  const [content, setContent] = useState(
    'You do not need three lights to look cinematic—you need one dark wall. Kill the ceiling bulb, put one soft key light 45 degrees off camera, and place black foam opposite it. Save this before your next shoot.'
  );

  const [analysis, setAnalysis] = useState<ViralAnalysisResult | null>(null);
  const [isSample, setIsSample] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (content.trim().length < 20) {
      setError('Paste at least 20 characters of script or caption content.');
      return;
    }

    setLoading(true);
    setError(null);
    setIsSample(false);
    try {
      const result = await analyzeViralApi({
        title: title.trim() || 'Untitled Draft',
        content: content.trim(),
        platform,
        audience: audience.trim(),
        brandVoice,
      });
      setAnalysis(result);
      await recordActivity('viral', title.trim() || 'Viral Quality Audit');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Viral analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!analysis) return;
    await saveLibraryItem({
      category: 'viral',
      title: `Viral Audit: ${title || 'Draft'} (${analysis.overallScore}/100)`,
      summary: analysis.summary,
      platform,
      tags: ['viral-analyzer', platform.toLowerCase().slice(0, 20)],
      payload: analysis as unknown as Record<string, unknown>,
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-5">
        <h1 className="text-2xl font-bold text-white">Viral Analyzer</h1>
        <p className="mt-1 text-sm text-[#b8bcd0]">
          Evaluate hook strength, relevance, clarity, engagement, storytelling, CTA, and structure out of 100.
        </p>
      </div>

      <GlassCard className="p-6">
        <form onSubmit={handleAnalyze} className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label htmlFor="va-title" className={labelClassName}>Title / Opening Hook</label>
            <input
              id="va-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="va-platform" className={labelClassName}>Platform</label>
            <select
              id="va-platform"
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
          <div className="sm:col-span-3">
            <label htmlFor="va-audience" className={labelClassName}>Target Audience</label>
            <input
              id="va-audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className={inputClassName}
            />
          </div>
          <div className="sm:col-span-3">
            <label htmlFor="va-content" className={labelClassName}>Script or Caption Draft</label>
            <textarea
              id="va-content"
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={inputClassName}
              required
            />
          </div>
          <div className="sm:col-span-3 flex flex-wrap items-center gap-3">
            <PrimaryButton type="submit" loading={loading}>
              Analyze Quality Score
            </PrimaryButton>
            {analysis && (
              <GlassButton onClick={handleSave}>
                <Bookmark className="h-4 w-4 text-violet-300" aria-hidden="true" />
                <span>Save Report</span>
              </GlassButton>
            )}
            <GlassButton
              onClick={() => {
                setError(null);
                setAnalysis(SAMPLE_VIRAL);
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

      {analysis && (
        <div className="space-y-6">
          <GlassCard className="p-6" withRefraction>
            <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#9ca2b8]">
                  <span>Overall Structural Quality</span>
                  {isSample && <span className="font-medium text-amber-300">· Sample data</span>}
                </div>
                <p className="mt-1 font-mono text-4xl font-bold text-white tabular-nums">
                  {analysis.overallScore}
                  <span className="text-lg font-normal text-[#9ca2b8]">/100</span>
                </p>
              </div>
              <div className="flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200">
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>AI-generated estimate, not a prediction or guarantee of virality.</span>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-[#d9dce8]">{analysis.summary}</p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {analysis.metrics.map((m) => (
                <div key={m.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between text-sm font-medium text-white">
                    <span>{m.label}</span>
                    <span className="font-mono text-violet-300 tabular-nums">{m.score}/100</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.max(0, m.score))}%` }}
                      transition={{ duration: 0.4 }}
                      className="h-full bg-violet-500"
                    />
                  </div>
                  <p className="mt-2.5 text-xs text-[#b8bcd0]">{m.explanation}</p>
                  <p className="mt-1 text-xs font-medium text-violet-200">Fix: {m.fix}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard subtle className="p-6">
            <h2 className="text-base font-semibold text-white">Priority Actionable Fixes</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-[#d9dce8]">
              {analysis.topFixes.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
