import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { runContentDoctorApi } from '../../services/aiClient';
import type { ContentDoctorResult } from '../../types/ideonix';
import {
  CopyTextButton,
  GlassCard,
  GlassSelect,
  inputClassName,
  labelClassName,
  PrimaryButton,
  ResultsSkeleton,
  SaveActionButton,
} from '../../components/ui/GlassPrimitives';
import { MOTION_EASING, useMotionSettings } from '../../config/motion';

export function ContentDoctorPage() {
  const { brandVoice, saveLibraryItem, recordActivity, notify } = useWorkspace();

  const [platform, setPlatform] = useState('Instagram Reels');
  const [goal, setGoal] = useState('Cut filler words, sharpen hook, clarify CTA');
  const [draft, setDraft] = useState(
    'Hey guys I just wanted to share why lighting actually really matters when you are basically filming in a small bedroom. Most people buy a new camera, when overhead lights flatten your face. Put a lamp to the side and a dark wall on the other side. Like and follow for more tips!'
  );

  const [report, setReport] = useState<ContentDoctorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { durations, d } = useMotionSettings();

  const handleDiagnose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (draft.trim().length < 20) {
      setError('Paste at least 20 characters to run Content Doctor.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await runContentDoctorApi({
        content: draft.trim(),
        platform,
        goal: goal.trim(),
        brandVoice,
      });
      setReport(result);
      await recordActivity('doctor', 'Content Doctor Diagnostic');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Content Doctor failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReport = async () => {
    if (!report) return;
    await saveLibraryItem({
      category: 'doctor',
      title: `Content Doctor: ${report.improvedHook.slice(0, 60)}`,
      summary: report.diagnosisSummary,
      platform,
      tags: ['content-doctor', 'editing'],
      payload: { original: draft, ...report },
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-5">
        <h1 className="text-2xl font-bold text-white">Content Doctor</h1>
        <p className="mt-1 text-sm text-neutral-300">
          Detects weak sections and filler wording, then compares Original vs. Improved side by side.
        </p>
      </div>

      <GlassCard index={0} className="p-6">
        <form onSubmit={handleDiagnose} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="doc-platform" className={labelClassName}>Platform</label>
            <GlassSelect
              id="doc-platform"
              value={platform}
              onChange={setPlatform}
              options={['Instagram Reels', 'YouTube Shorts', 'YouTube Long-form', 'LinkedIn']}
            />
          </div>
          <div>
            <label htmlFor="doc-goal" className={labelClassName}>Refinement Goal</label>
            <input
              id="doc-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className={inputClassName}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="doc-draft" className={labelClassName}>Original Draft</label>
            <textarea
              id="doc-draft"
              rows={5}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className={inputClassName}
              required
            />
          </div>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <PrimaryButton type="submit" loading={loading}>
              Diagnose & Improve
            </PrimaryButton>
            {report && (
              <SaveActionButton
                onSave={handleSaveReport}
                label="Save Diagnostic"
                savedLabel="Saved Diagnostic"
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
        <ResultsSkeleton variant="doctor" />
      ) : report ? (
        <div className="space-y-6">
          {/* Diagnosis & Filler Words */}
          <GlassCard index={0} className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Diagnosis Summary</h2>
            </div>
            <p className="mt-2 text-sm text-neutral-200">{report.diagnosisSummary}</p>
            {report.unnecessaryWording?.length > 0 && (
              <p className="mt-3 text-xs text-neutral-400">
                Filler wording flagged:{' '}
                <span className="font-mono text-white">
                  {report.unnecessaryWording.join(', ')}
                </span>
              </p>
            )}
          </GlassCard>

          {/* Side-by-Side Original vs Improved (slide in from left and right) */}
          <div className="grid gap-5 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: durations.slow, ease: MOTION_EASING.out }}
            >
              <GlassCard className="h-full p-6">
                <p className="text-xs font-semibold text-neutral-400">Original Draft</p>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-neutral-300">
                  {draft}
                </p>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: durations.slow,
                delay: d(0.05),
                ease: MOTION_EASING.out,
              }}
            >
              <GlassCard className="h-full p-6">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-white">Improved Version</p>
                  <div className="flex items-center gap-2">
                    <motion.button
                      type="button"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: durations.fast, ease: MOTION_EASING.out }}
                      onClick={() => {
                        setDraft(report.improvedFullText);
                        notify('Applied improved version to editor.');
                      }}
                      className="glass min-h-[36px] rounded-xl px-3 py-1.5 text-xs font-medium text-white hover:border-white/30"
                    >
                      Apply to Draft
                    </motion.button>
                    <CopyTextButton text={report.improvedFullText} />
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white">
                  {report.improvedFullText}
                </p>
                <div className="mt-4 border-t border-white/10 pt-3 text-xs space-y-1">
                  <p>
                    <span className="font-semibold text-neutral-300">Improved Hook: </span>
                    <span className="text-white">{report.improvedHook}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-neutral-300">Improved CTA: </span>
                    <span className="text-white">{report.improvedCta}</span>
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Itemized Side-by-Side Change Explanations */}
          <GlassCard index={1} className="p-6">
            <h2 className="text-base font-semibold text-white">Section-by-Section Changes</h2>
            <div className="mt-4 divide-y divide-white/10">
              {report.changes.map((chg, idx) => (
                <div key={idx} className="py-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white">{chg.section}</h3>
                    <span className="text-xs text-neutral-400">Issue: {chg.weakness}</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <motion.div
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: durations.base,
                        delay: d(idx * 0.04),
                        ease: MOTION_EASING.out,
                      }}
                      className="glass rounded-xl p-3 text-xs text-neutral-300"
                    >
                      <p className="mb-1 font-medium text-neutral-400">Before</p>
                      <p>{chg.originalSnippet}</p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: 14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: durations.base,
                        delay: d(idx * 0.04 + 0.04),
                        ease: MOTION_EASING.out,
                      }}
                      className="glass rounded-xl border-white/25 bg-white/10 p-3 text-xs text-white"
                    >
                      <p className="mb-1 font-medium text-neutral-200">After</p>
                      <p>{chg.improvedSnippet}</p>
                    </motion.div>
                  </div>
                  <p className="text-xs text-neutral-300">Why it works: {chg.reason}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      ) : null}
    </div>
  );
}
