import React, { useEffect, useState } from 'react';
import { animate, motion } from 'motion/react';
import { Info } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { analyzeViralApi } from '../../services/aiClient';
import type { ViralAnalysisResult } from '../../types/ideonix';
import {
  GlassCard,
  GlassSelect,
  inputClassName,
  labelClassName,
  PrimaryButton,
  ResultsSkeleton,
  SaveActionButton,
} from '../../components/ui/GlassPrimitives';
import { MOTION_EASING, useMotionSettings } from '../../config/motion';

function ViralScoreGauge({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, score));
  const [displayScore, setDisplayScore] = useState(0);
  const { durations } = useMotionSettings();

  useEffect(() => {
    setDisplayScore(0);
    const controls = animate(0, clamped, {
      duration: durations.slow,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplayScore(Math.round(latest)),
    });
    return () => controls.stop();
  }, [clamped, durations.slow]);

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-24 w-24 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="7"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#ffffff"
            strokeWidth="7"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: clamped / 100 }}
            transition={{ duration: durations.slow, ease: MOTION_EASING.out }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-bold text-white tabular-nums">
            {displayScore}
          </span>
          <span className="font-mono text-[10px] text-neutral-400">/100</span>
        </div>
      </div>

      <div>
        <p className="text-xs text-neutral-400">Overall Structural Quality</p>
        <p className="mt-1 font-mono text-3xl font-bold text-white tabular-nums">
          {displayScore}
          <span className="text-base font-normal text-neutral-400">/100</span>
        </p>
      </div>
    </div>
  );
}

export function ViralAnalyzerPage() {
  const { brandVoice, saveLibraryItem, recordActivity } = useWorkspace();

  const [title, setTitle] = useState('One-Light Desk Setup That Looks Like a Studio');
  const [platform, setPlatform] = useState('Instagram Reels');
  const [audience, setAudience] = useState('Solo creators filming at home');
  const [content, setContent] = useState(
    'You do not need three lights to look cinematic—you need one dark wall. Kill the ceiling bulb, put one soft key light 45 degrees off camera, and place black foam opposite it. Save this before your next shoot.'
  );

  const [analysis, setAnalysis] = useState<ViralAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { durations, d } = useMotionSettings();

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (content.trim().length < 20) {
      setError('Paste at least 20 characters of script or caption content.');
      return;
    }

    setLoading(true);
    setError(null);
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
        <p className="mt-1 text-sm text-neutral-300">
          Evaluate hook strength, relevance, clarity, engagement, storytelling, CTA, and structure out of 100.
        </p>
      </div>

      <GlassCard index={0} className="p-6">
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
            <GlassSelect
              id="va-platform"
              value={platform}
              onChange={setPlatform}
              options={['Instagram Reels', 'YouTube Shorts', 'YouTube Long-form', 'LinkedIn', 'X']}
            />
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
              <SaveActionButton
                onSave={handleSave}
                label="Save Report"
                savedLabel="Saved Report"
              />
            )}
          </div>
        </form>

        {error && (
          <div role="alert" className="glass mt-4 rounded-xl px-4 py-3 text-xs text-white">
            {error}
          </div>
        )}
      </GlassCard>

      {loading ? (
        <ResultsSkeleton variant="viral" />
      ) : analysis ? (
        <div className="space-y-6">
          <GlassCard index={0} className="p-6">
            <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center">
              <ViralScoreGauge score={analysis.overallScore} />
              <div className="glass flex items-start gap-2 rounded-xl px-4 py-2.5 text-xs text-neutral-200">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-white" aria-hidden="true" />
                <span>AI-generated estimate, not a prediction or guarantee of virality.</span>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-neutral-200">{analysis.summary}</p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {analysis.metrics.map((m, idx) => (
                <div key={m.label} className="glass rounded-xl p-4">
                  <div className="flex items-center justify-between text-sm font-medium text-white">
                    <span>{m.label}</span>
                    <span className="font-mono text-white tabular-nums">{m.score}/100</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: Math.min(1, Math.max(0, m.score / 100)) }}
                      transition={{
                        duration: durations.slow,
                        delay: d(idx * 0.04),
                        ease: MOTION_EASING.out,
                      }}
                      style={{ transformOrigin: 'left' }}
                      className="h-full w-full bg-white"
                    />
                  </div>
                  <p className="mt-2.5 text-xs text-neutral-300">{m.explanation}</p>
                  <p className="mt-1 text-xs font-medium text-white">Fix: {m.fix}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard index={1} className="p-6">
            <h2 className="text-base font-semibold text-white">Priority Actionable Fixes</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-neutral-200">
              {analysis.topFixes.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </GlassCard>
        </div>
      ) : null}
    </div>
  );
}
