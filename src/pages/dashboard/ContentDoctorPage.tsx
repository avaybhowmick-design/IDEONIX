import React, { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { runContentDoctorApi } from '../../services/aiClient';
import type { ContentDoctorResult } from '../../types/ideonix';
import {
  CopyTextButton,
  GlassButton,
  GlassCard,
  inputClassName,
  labelClassName,
  PrimaryButton,
} from '../../components/ui/GlassPrimitives';

const SAMPLE_DOCTOR: ContentDoctorResult = {
  diagnosisSummary:
    'Trimmed throat-clearing filler in the opening line, sharpened the visual contrast, and converted the passive closing into a specific save-worthy CTA.',
  unnecessaryWording: ['basically', 'actually really', 'just wanted to share'],
  improvedHook: 'Turn off your ceiling light before buying a $900 camera.',
  improvedCta: 'Save this 45-degree angle rule before your next shoot.',
  improvedFullText:
    'Turn off your ceiling light before buying a $900 camera. Overhead bulbs flatten every shadow on your face. Put one soft lamp 45 degrees to your side and keep the opposite wall dark. Contrast makes inexpensive footage look intentional. Save this 45-degree angle rule before your next shoot.',
  changes: [
    {
      section: 'Opening Hook',
      weakness: 'Soft qualifier delayed the visual contrast.',
      originalSnippet: 'Hey guys I just wanted to share why lighting actually really matters.',
      improvedSnippet: 'Turn off your ceiling light before buying a $900 camera.',
      reason: 'Opens with an immediate physical action and stakes.',
    },
    {
      section: 'Closing CTA',
      weakness: 'Generic follow request.',
      originalSnippet: 'Like and follow for more tips!',
      improvedSnippet: 'Save this 45-degree angle rule before your next shoot.',
      reason: 'Ties the CTA directly to future creator behavior.',
    },
  ],
};

export function ContentDoctorPage() {
  const { brandVoice, saveLibraryItem, recordActivity, notify } = useWorkspace();

  const [platform, setPlatform] = useState('Instagram Reels');
  const [goal, setGoal] = useState('Cut filler words, sharpen hook, clarify CTA');
  const [draft, setDraft] = useState(
    'Hey guys I just wanted to share why lighting actually really matters when you are basically filming in a small bedroom. Most people buy a new camera, when overhead lights flatten your face. Put a lamp to the side and a dark wall on the other side. Like and follow for more tips!'
  );

  const [report, setReport] = useState<ContentDoctorResult | null>(null);
  const [isSample, setIsSample] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDiagnose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (draft.trim().length < 20) {
      setError('Paste at least 20 characters to run Content Doctor.');
      return;
    }

    setLoading(true);
    setError(null);
    setIsSample(false);
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
        <p className="mt-1 text-sm text-[#b8bcd0]">
          Detects weak sections and filler wording, then compares Original vs. Improved side by side.
        </p>
      </div>

      <GlassCard className="p-6">
        <form onSubmit={handleDiagnose} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="doc-platform" className={labelClassName}>Platform</label>
            <select
              id="doc-platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className={inputClassName}
            >
              <option>Instagram Reels</option>
              <option>YouTube Shorts</option>
              <option>YouTube Long-form</option>
              <option>LinkedIn</option>
            </select>
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
              <GlassButton onClick={handleSaveReport}>
                <Bookmark className="h-4 w-4 text-violet-300" aria-hidden="true" />
                <span>Save Diagnostic</span>
              </GlassButton>
            )}
            <GlassButton
              onClick={() => {
                setError(null);
                setReport(SAMPLE_DOCTOR);
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

      {report && (
        <div className="space-y-6">
          {/* Diagnosis & Filler Words */}
          <GlassCard subtle className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Diagnosis Summary</h2>
              {isSample && <span className="text-xs font-medium text-amber-300">Sample data</span>}
            </div>
            <p className="mt-2 text-sm text-[#d9dce8]">{report.diagnosisSummary}</p>
            {report.unnecessaryWording?.length > 0 && (
              <p className="mt-3 text-xs text-[#9ca2b8]">
                Filler wording flagged:{' '}
                <span className="font-mono text-rose-300">
                  {report.unnecessaryWording.join(', ')}
                </span>
              </p>
            )}
          </GlassCard>

          {/* Side-by-Side Original vs Improved */}
          <div className="grid gap-5 lg:grid-cols-2">
            <GlassCard subtle className="p-6">
              <p className="text-xs font-semibold text-[#9ca2b8]">Original Draft</p>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[#b8bcd0]">
                {draft}
              </p>
            </GlassCard>

            <GlassCard className="p-6" withRefraction>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-violet-300">Improved Version</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(report.improvedFullText);
                      notify('Applied improved version to editor.');
                    }}
                    className="min-h-[36px] rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-white hover:bg-white/[0.1]"
                  >
                    Apply to Draft
                  </button>
                  <CopyTextButton text={report.improvedFullText} />
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white">
                {report.improvedFullText}
              </p>
              <div className="mt-4 border-t border-white/10 pt-3 text-xs space-y-1">
                <p>
                  <span className="font-semibold text-violet-300">Improved Hook: </span>
                  <span className="text-white">{report.improvedHook}</span>
                </p>
                <p>
                  <span className="font-semibold text-violet-300">Improved CTA: </span>
                  <span className="text-white">{report.improvedCta}</span>
                </p>
              </div>
            </GlassCard>
          </div>

          {/* Itemized Side-by-Side Change Explanations */}
          <GlassCard subtle className="p-6">
            <h2 className="text-base font-semibold text-white">Section-by-Section Changes</h2>
            <div className="mt-4 divide-y divide-white/10">
              {report.changes.map((chg, idx) => (
                <div key={idx} className="py-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white">{chg.section}</h3>
                    <span className="text-xs text-[#9ca2b8]">Issue: {chg.weakness}</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-[#9ca2b8]">
                      <p className="mb-1 font-medium text-[#7e8399]">Before</p>
                      <p>{chg.originalSnippet}</p>
                    </div>
                    <div className="rounded-xl border border-violet-400/25 bg-violet-500/10 p-3 text-xs text-white">
                      <p className="mb-1 font-medium text-violet-300">After</p>
                      <p>{chg.improvedSnippet}</p>
                    </div>
                  </div>
                  <p className="text-xs text-[#b8bcd0]">Why it works: {chg.reason}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
