import React, { useState } from 'react';
import { Bookmark, CalendarPlus, Check, Loader2, Play, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { runAutopilotStepApi } from '../../services/aiClient';
import type {
  AutopilotState,
  AutopilotStepId,
  BrandVoicePreset,
} from '../../types/ideonix';
import {
  CopyTextButton,
  GlassButton,
  GlassCard,
  inputClassName,
  labelClassName,
  PrimaryButton,
} from '../../components/ui/GlassPrimitives';

const STEPS: Array<{ id: AutopilotStepId; title: string; subtitle: string }> = [
  { id: 'preferences', title: '01. Understand Preferences', subtitle: 'Pillars & brand voice alignment' },
  { id: 'strategy', title: '02. Campaign Strategy', subtitle: 'Positioning & cadence architecture' },
  { id: 'ideas', title: '03. Content Ideas', subtitle: '4 hook-led angles' },
  { id: 'script', title: '04. Flagship Script', subtitle: 'Scenes, voiceover & visual cues' },
  { id: 'captions', title: '05. Captions & Hashtags', subtitle: 'Multi-tone copy variations' },
  { id: 'quality', title: '06. Viral Quality Audit', subtitle: '7-axis structural evaluation' },
  { id: 'improve', title: '07. Content Doctor Fixes', subtitle: 'Tightened hook, pacing & CTA' },
  { id: 'calendar', title: '08. Weekly Publishing Plan', subtitle: 'Ready-to-schedule post slots' },
];

const SAMPLE_AUTOPILOT: AutopilotState = {
  preferences: {
    positioningSummary: 'Focused on practical studio workflows for creators filming in small spaces.',
    contentPillars: ['One-light lighting setups', 'Retention pacing edits', 'Weekly batching systems'],
    toneAlignment: 'Storytelling — direct, calm, zero-fluff delivery.',
  },
  strategy: {
    campaignTitle: 'Small-Room Studio Mastery Sprint',
    overview: 'A 7-day sequence proving that light contrast and tight editing outperform expensive camera upgrades.',
    targetOutcome: 'Increase saves and shares among solo creators.',
    cadenceRecommendation: '5 short-form drops alternating Reels and Shorts.',
  },
  ideas: [
    {
      id: 'sample_ap_1',
      title: 'Why Your Ceiling Light Ruins Video Depth',
      description: 'Side-by-side switch from overhead light to a 45-degree soft key.',
      hook: 'Before buying a new camera, turn off your ceiling light.',
      format: '45s Reel',
      audienceRelevance: 'Instant win for home-office creators.',
      cta: 'Save before filming tomorrow.',
    },
  ],
  script: {
    title: 'Before Buying a New Camera, Turn Off Your Ceiling Light',
    platform: 'Instagram Reels',
    duration: '45s',
    hook: 'Before buying a new camera, turn off your ceiling light.',
    fullScript:
      'Before buying a new camera, turn off your ceiling light. Overhead fixtures flatten shadows and wash out skin tones. Place one soft lamp 45 degrees off camera and leave the opposite wall dark. Instant depth.',
    scenes: [
      {
        sceneNumber: 1,
        timeRange: '0:00 - 0:06',
        visual: 'Creator flicks off overhead switch in bedroom studio.',
        voiceover: 'Before buying a new camera, turn off your ceiling light.',
        transition: 'Snap cut on switch click',
      },
    ],
    voiceoverNotes: 'Calm, confident pacing.',
    visualSuggestions: ['Split-screen lighting comparison'],
    transitionSuggestions: ['Audio pre-lap on switch click'],
    endingAndCta: 'Save this angle rule before your next shoot.',
  },
  captions: [
    {
      style: 'Engaging',
      caption: 'One 45-degree key light and a dark wall beats expensive gear every day.',
      hashtags: ['#StudioSetup', '#CreatorTips', '#LightingDesign'],
      cta: 'Which setup problem slows you down most?',
    },
  ],
  quality: {
    overallScore: 87,
    summary: 'Strong visual contrast hook with immediate practical payoff.',
    metrics: [
      { label: 'Hook Strength', score: 91, explanation: 'Direct visual disruption.', fix: 'Show split-frame within 1.5s.' },
      { label: 'Clarity', score: 89, explanation: 'Single actionable physical rule.', fix: 'Add 45° graphic overlay.' },
    ],
    topFixes: ['Show before/after frame in first 2 seconds'],
    disclaimer: 'AI-generated estimate, not a prediction or guarantee of virality.',
  },
  improve: {
    diagnosisSummary: 'Replaced abstract adjective with measurable 45-degree placement instruction.',
    unnecessaryWording: ['basically', 'actually'],
    improvedFullText:
      'Turn off your ceiling light before buying a new camera. Put one soft lamp 45 degrees to your side and keep the far wall dark for instant depth.',
    improvedHook: 'Turn off your ceiling light before buying a new camera.',
    improvedCta: 'Save this 45-degree rule before your next shoot.',
    changes: [
      {
        section: 'Opening Hook',
        weakness: 'Delaying the actionable verb.',
        originalSnippet: 'Before buying a new camera, turn off your ceiling light.',
        improvedSnippet: 'Turn off your ceiling light before buying a new camera.',
        reason: 'Leads immediately with the concrete physical action.',
      },
    ],
  },
  calendar: {
    weeklyPlan: [
      {
        dayLabel: 'Day 1',
        suggestedDate: new Date().toISOString().slice(0, 10),
        platform: 'Instagram Reels',
        format: '45s Reel',
        title: 'Turn Off Your Ceiling Light',
        hook: 'Turn off your ceiling light before buying a new camera.',
        caption: 'One 45-degree key light and a dark wall beats expensive gear every day.',
      },
    ],
  },
};

export function AutopilotPage() {
  const { brandVoice, saveLibraryItem, saveCampaign, saveCalendarEntry, recordActivity, notify } =
    useWorkspace();

  const [niche, setNiche] = useState('Video Creation & Creator Productivity');
  const [topic, setTopic] = useState('Building a repeatable small-room studio workflow');
  const [audience, setAudience] = useState('Instagram Reels and YouTube Shorts creators');
  const [platform, setPlatform] = useState('Instagram Reels & YouTube Shorts');
  const [voiceOverride, setVoiceOverride] = useState<BrandVoicePreset>(brandVoice.preset);
  const [duration, setDuration] = useState('7 days');
  const [goals, setGoals] = useState('Increase saves, retention, and weekly posting consistency');

  const [state, setState] = useState<AutopilotState>({});
  const [isSample, setIsSample] = useState(false);
  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState<AutopilotStepId | null>(null);
  const [completedSteps, setCompletedSteps] = useState<AutopilotStepId[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedStepView, setSelectedStepView] = useState<AutopilotStepId>('preferences');

  const effectiveVoice = { ...brandVoice, preset: voiceOverride };

  const executeStep = async (
    step: AutopilotStepId,
    currentState: AutopilotState
  ): Promise<AutopilotState> => {
    setActiveStep(step);
    setSelectedStepView(step);

    const result = await runAutopilotStepApi<unknown>({
      step,
      niche: niche.trim(),
      topic: topic.trim(),
      audience: audience.trim(),
      platform,
      duration,
      goals: goals.trim(),
      brandVoice: effectiveVoice,
      context: currentState as Record<string, unknown>,
    });

    const nextState = { ...currentState, [step]: result } as AutopilotState;
    setState(nextState);
    setCompletedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
    return nextState;
  };

  const handleRunFullAutopilot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (running || activeStep) return;
    if (!niche.trim() || !topic.trim() || !audience.trim() || !goals.trim()) {
      setError('Please fill in Niche, Topic, Audience, and Goals.');
      return;
    }

    setRunning(true);
    setError(null);
    setIsSample(false);
    setState({});
    setCompletedSteps([]);

    let rollingState: AutopilotState = {};
    try {
      for (const s of STEPS) {
        rollingState = await executeStep(s.id, rollingState);
      }
      await recordActivity('autopilot', topic.trim());
      notify('Creator Autopilot finished all 8 steps.');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Autopilot stopped due to an API error. You can retry the failed step individually.'
      );
    } finally {
      setActiveStep(null);
      setRunning(false);
    }
  };

  const handleRegenerateStep = async (step: AutopilotStepId) => {
    if (running || activeStep) return;
    setError(null);
    setIsSample(false);
    try {
      await executeStep(step, state);
      notify(`Regenerated "${STEPS.find((s) => s.id === step)?.title}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate step.');
    } finally {
      setActiveStep(null);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!state.strategy && !state.script) return;
    const title = state.strategy?.campaignTitle || topic;
    await saveLibraryItem({
      category: 'autopilot',
      title,
      summary: state.strategy?.overview || `Autopilot pack for ${topic}`,
      platform,
      tags: ['autopilot', voiceOverride.toLowerCase()],
      payload: state as unknown as Record<string, unknown>,
    });

    if (state.calendar?.weeklyPlan?.length) {
      await saveCampaign({
        title,
        topic,
        objective: goals,
        audience,
        duration,
        platform,
        overview: state.strategy?.overview || '',
        status: 'Active',
        days: state.calendar.weeklyPlan.map((w, idx) => ({
          day: idx + 1,
          publishDate: w.suggestedDate,
          title: w.title,
          format: w.format,
          idea: w.hook,
          scriptOutline: state.script?.hook || '',
          caption: w.caption,
          hashtags: [],
        })),
        checklist: [
          { id: 'ap_c1', label: 'Review edited Content Doctor hook', done: false },
          { id: 'ap_c2', label: 'Shoot A-roll using scene breakdown', done: false },
          { id: 'ap_c3', label: 'Finalize schedule in Content Calendar', done: false },
        ],
      });
    }
  };

  const handlePushToCalendar = async () => {
    const plan = state.calendar?.weeklyPlan || [];
    if (plan.length === 0) return;
    for (const item of plan) {
      await saveCalendarEntry({
        title: item.title,
        date: item.suggestedDate || new Date().toISOString().slice(0, 10),
        timeSlot: '18:00',
        platform: item.platform || platform,
        status: 'Planned',
        notes: `${item.format} · Hook: ${item.hook}\n\nCaption: ${item.caption}`,
        reminderAt: '',
        linkedScriptId: '',
        linkedScriptTitle: state.script?.title || '',
        linkedCaptionId: '',
        linkedCaptionTitle: '',
      });
    }
    notify(`Added ${plan.length} posts from Autopilot to Content Calendar.`);
  };

  const progressPct = Math.round((completedSteps.length / STEPS.length) * 100);

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-5">
        <h1 className="text-2xl font-bold text-white">Creator Autopilot</h1>
        <p className="mt-1 text-sm text-[#b8bcd0]">
          End-to-end autonomous pipeline connecting preferences, strategy, ideas, script, captions, viral critique, Content Doctor edits, and weekly schedule.
        </p>
      </div>

      {/* Autopilot Input Form */}
      <GlassCard className="p-6">
        <form onSubmit={handleRunFullAutopilot} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="ap-niche" className={labelClassName}>Niche</label>
            <input
              id="ap-niche"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className={inputClassName}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="ap-topic" className={labelClassName}>Campaign Topic</label>
            <input
              id="ap-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className={inputClassName}
              required
            />
          </div>
          <div>
            <label htmlFor="ap-audience" className={labelClassName}>Target Audience</label>
            <input
              id="ap-audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className={inputClassName}
              required
            />
          </div>
          <div>
            <label htmlFor="ap-platform" className={labelClassName}>Platform Focus</label>
            <input
              id="ap-platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="ap-voice" className={labelClassName}>Brand Voice</label>
            <select
              id="ap-voice"
              value={voiceOverride}
              onChange={(e) => setVoiceOverride(e.target.value as BrandVoicePreset)}
              className={inputClassName}
            >
              {['Cinematic', 'Professional', 'Funny', 'Minimal', 'Educational', 'Storytelling', 'Bold', 'Friendly'].map(
                (v) => (
                  <option key={v} value={v}>{v}</option>
                )
              )}
            </select>
          </div>
          <div>
            <label htmlFor="ap-duration" className={labelClassName}>Duration</label>
            <select
              id="ap-duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className={inputClassName}
            >
              <option>5 days</option>
              <option>7 days</option>
              <option>14 days</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="ap-goals" className={labelClassName}>Goals & Outcomes</label>
            <input
              id="ap-goals"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              className={inputClassName}
              required
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap items-center gap-3 pt-2">
            <PrimaryButton type="submit" loading={running}>
              {!running && <Play className="h-4 w-4" aria-hidden="true" />}
              <span>{running ? 'Running Autopilot...' : 'Run Full Autopilot'}</span>
            </PrimaryButton>
            <GlassButton
              disabled={running}
              onClick={() => {
                setError(null);
                setState(SAMPLE_AUTOPILOT);
                setIsSample(true);
                setCompletedSteps(STEPS.map((s) => s.id));
                setSelectedStepView('strategy');
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

      {/* Real Progress Bar & Stepper */}
      <GlassCard subtle className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Workflow Progress {isSample ? '· Sample data' : ''}
            </h2>
            <p className="text-xs text-[#9ca2b8]">
              {activeStep
                ? `Executing: ${STEPS.find((s) => s.id === activeStep)?.title}`
                : completedSteps.length === STEPS.length
                ? 'All 8 steps completed'
                : 'Select any completed step to inspect or regenerate'}
            </p>
          </div>
          <span className="font-mono text-sm font-semibold text-violet-300 tabular-nums">
            {completedSteps.length}/{STEPS.length} ({progressPct}%)
          </span>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full bg-violet-500"
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.25 }}
          />
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => {
            const done = completedSteps.includes(step.id);
            const isRunningStep = activeStep === step.id;
            const isSelected = selectedStepView === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setSelectedStepView(step.id)}
                className={`flex min-h-[56px] items-start justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                  isSelected
                    ? 'border-violet-400/60 bg-violet-500/15'
                    : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-white">{step.title}</p>
                  <p className="truncate text-[11px] text-[#9ca2b8]">{step.subtitle}</p>
                </div>
                <span className="mt-0.5 shrink-0">
                  {isRunningStep ? (
                    <Loader2 className="h-4 w-4 animate-spin text-violet-300" aria-hidden="true" />
                  ) : done ? (
                    <Check className="h-4 w-4 text-violet-300" aria-hidden="true" />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* Active Step Output & Actions */}
      {completedSteps.length > 0 && (
        <GlassCard className="p-6" withRefraction>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <p className="text-xs text-[#9ca2b8]">
                {STEPS.find((s) => s.id === selectedStepView)?.subtitle}
                {isSample ? ' · Sample data' : ''}
              </p>
              <h2 className="text-lg font-semibold text-white">
                {STEPS.find((s) => s.id === selectedStepView)?.title}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <GlassButton
                onClick={() => handleRegenerateStep(selectedStepView)}
                loading={activeStep === selectedStepView}
                disabled={running}
                className="px-3 py-1.5 text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Regenerate Step</span>
              </GlassButton>
              <GlassButton onClick={handleSaveToLibrary} className="px-3 py-1.5 text-xs">
                <Bookmark className="h-3.5 w-3.5 text-violet-300" aria-hidden="true" />
                <span>Save Pack</span>
              </GlassButton>
              {state.calendar?.weeklyPlan?.length ? (
                <PrimaryButton onClick={handlePushToCalendar} className="px-3 py-1.5 text-xs">
                  <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Push to Calendar</span>
                </PrimaryButton>
              ) : null}
            </div>
          </div>

          <div className="mt-5">
            {selectedStepView === 'preferences' && state.preferences && (
              <div className="space-y-3 text-sm">
                <p className="text-white">{state.preferences.positioningSummary}</p>
                <p className="text-xs text-violet-300">Tone Alignment: {state.preferences.toneAlignment}</p>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[#9ca2b8]">Content Pillars:</p>
                  <ul className="list-disc pl-5 text-sm text-[#d9dce8]">
                    {state.preferences.contentPillars.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {selectedStepView === 'strategy' && state.strategy && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="ap-edit-title" className={labelClassName}>Campaign Title (Editable)</label>
                  <input
                    id="ap-edit-title"
                    value={state.strategy.campaignTitle}
                    onChange={(e) =>
                      setState({
                        ...state,
                        strategy: { ...state.strategy!, campaignTitle: e.target.value },
                      })
                    }
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label htmlFor="ap-edit-overview" className={labelClassName}>Final Campaign Overview (Editable)</label>
                  <textarea
                    id="ap-edit-overview"
                    rows={4}
                    value={state.strategy.overview}
                    onChange={(e) =>
                      setState({
                        ...state,
                        strategy: { ...state.strategy!, overview: e.target.value },
                      })
                    }
                    className={inputClassName}
                  />
                </div>
                <p className="text-xs text-[#b8bcd0]">
                  Outcome: {state.strategy.targetOutcome} · Cadence: {state.strategy.cadenceRecommendation}
                </p>
              </div>
            )}

            {selectedStepView === 'ideas' && state.ideas && (
              <div className="grid gap-4 md:grid-cols-2">
                {state.ideas.map((idea) => (
                  <div key={idea.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
                    <p className="text-xs text-violet-300">{idea.format}</p>
                    <h3 className="text-sm font-semibold text-white">{idea.title}</h3>
                    <p className="text-xs text-[#b8bcd0]">{idea.description}</p>
                    <p className="text-xs text-white">Hook: {idea.hook}</p>
                  </div>
                ))}
              </div>
            )}

            {selectedStepView === 'script' && state.script && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white">{state.script.title}</h3>
                  <CopyTextButton text={`${state.script.hook}\n\n${state.script.fullScript}`} />
                </div>
                <p className="text-sm text-violet-200">Hook: {state.script.hook}</p>
                <p className="whitespace-pre-line text-sm text-[#d9dce8]">{state.script.fullScript}</p>
              </div>
            )}

            {selectedStepView === 'captions' && state.captions && (
              <div className="space-y-3">
                {state.captions.map((cap, idx) => (
                  <div key={idx} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-violet-300">{cap.style}</span>
                      <CopyTextButton text={`${cap.caption}\n${cap.hashtags.join(' ')}`} />
                    </div>
                    <p className="mt-2 text-sm text-white">{cap.caption}</p>
                    <p className="mt-1 font-mono text-xs text-[#9ca2b8]">{cap.hashtags.join(' ')}</p>
                  </div>
                ))}
              </div>
            )}

            {selectedStepView === 'quality' && state.quality && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-mono text-2xl font-bold text-white tabular-nums">
                    Score: {state.quality.overallScore}/100
                  </p>
                  <p className="text-xs text-amber-300">{state.quality.disclaimer}</p>
                </div>
                <p className="text-sm text-[#b8bcd0]">{state.quality.summary}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {state.quality.metrics.map((m) => (
                    <div key={m.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                      <div className="flex justify-between text-xs font-medium text-white">
                        <span>{m.label}</span>
                        <span className="font-mono tabular-nums text-violet-300">{m.score}/100</span>
                      </div>
                      <p className="mt-1 text-xs text-[#9ca2b8]">{m.fix}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedStepView === 'improve' && state.improve && (
              <div className="space-y-4">
                <p className="text-sm text-[#b8bcd0]">{state.improve.diagnosisSummary}</p>
                <div className="rounded-xl border border-violet-400/30 bg-violet-500/10 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-violet-300">Improved Draft</span>
                    <CopyTextButton text={state.improve.improvedFullText} />
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm text-white">
                    {state.improve.improvedFullText}
                  </p>
                </div>
              </div>
            )}

            {selectedStepView === 'calendar' && state.calendar && (
              <div className="space-y-3">
                {state.calendar.weeklyPlan.map((slot, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="text-xs text-violet-300">
                        {slot.dayLabel} · {slot.suggestedDate} · {slot.platform} ({slot.format})
                      </p>
                      <h3 className="mt-1 text-sm font-semibold text-white">{slot.title}</h3>
                      <p className="mt-0.5 text-xs text-[#b8bcd0]">{slot.hook}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!state[selectedStepView] && (
              <p className="text-sm text-[#9ca2b8]">
                This step has not run yet. Click Run Full Autopilot or Regenerate Step.
              </p>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
