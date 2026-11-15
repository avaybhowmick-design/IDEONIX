import React, { useState } from 'react';
import { CalendarPlus, Check, Loader2, Play, RefreshCw } from 'lucide-react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
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
  GlassSelect,
  inputClassName,
  labelClassName,
  PrimaryButton,
  ResultsSkeleton,
  SaveActionButton,
} from '../../components/ui/GlassPrimitives';
import { MOTION_EASING, useMotionSettings } from '../../config/motion';

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
  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState<AutopilotStepId | null>(null);
  const [completedSteps, setCompletedSteps] = useState<AutopilotStepId[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedStepView, setSelectedStepView] = useState<AutopilotStepId>('preferences');

  const { durations, tabTransition } = useMotionSettings();

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

  const progressRatio = completedSteps.length / STEPS.length;
  const progressPct = Math.round(progressRatio * 100);

  return (
    <div className="space-y-6">
      <div className="border-b border-white/15 pb-5">
        <h1 className="text-2xl font-bold text-white">Creator Autopilot</h1>
        <p className="mt-1 text-sm text-neutral-300">
          End-to-end autonomous pipeline connecting preferences, strategy, ideas, script, captions, viral critique, Content Doctor edits, and weekly schedule.
        </p>
      </div>

      {/* Autopilot Input Form */}
      <GlassCard index={0} className="p-6">
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
            <GlassSelect
              id="ap-voice"
              value={voiceOverride}
              onChange={(v) => setVoiceOverride(v as BrandVoicePreset)}
              options={[
                'Cinematic',
                'Professional',
                'Funny',
                'Minimal',
                'Educational',
                'Storytelling',
                'Bold',
                'Friendly',
              ]}
            />
          </div>
          <div>
            <label htmlFor="ap-duration" className={labelClassName}>Duration</label>
            <GlassSelect
              id="ap-duration"
              value={duration}
              onChange={setDuration}
              options={['5 days', '7 days', '14 days']}
            />
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
          </div>
        </form>

        {error && (
          <div role="alert" className="glass mt-4 rounded-xl !border-white/35 !bg-white/10 px-4 py-3 text-xs text-white">
            {error}
          </div>
        )}
      </GlassCard>

      {/* Real Progress Stepper with Connecting Line */}
      <GlassCard index={1} className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Workflow Progress</h2>
            <p className="text-xs text-neutral-400">
              {activeStep
                ? `Executing: ${STEPS.find((s) => s.id === activeStep)?.title}`
                : completedSteps.length === STEPS.length
                ? 'All 8 steps completed'
                : 'Select any completed step to inspect or regenerate'}
            </p>
          </div>
          <span className="font-mono text-sm font-semibold text-white tabular-nums">
            {completedSteps.length}/{STEPS.length} ({progressPct}%)
          </span>
        </div>

        {/* Visual Node + Connector Line Track (driven by real API step state) */}
        <div className="mt-5 overflow-x-auto pb-1">
          <div className="flex min-w-[540px] items-center justify-between px-1">
            {STEPS.map((step, idx) => {
              const done = completedSteps.includes(step.id);
              const isActive = activeStep === step.id;
              const nodeStatus = isActive ? 'active' : done ? 'done' : 'pending';
              const segmentFilled = done;

              return (
                <React.Fragment key={step.id}>
                  <motion.button
                    type="button"
                    onClick={() => setSelectedStepView(step.id)}
                    aria-label={step.title}
                    initial={false}
                    animate={{
                      scale: nodeStatus === 'active' ? 1.12 : 1,
                      opacity: nodeStatus === 'pending' ? 0.5 : 1,
                    }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: durations.base, ease: MOTION_EASING.out }}
                    className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-mono font-semibold transition-colors ${
                      nodeStatus === 'done'
                        ? 'border-white bg-white text-[#050505]'
                        : nodeStatus === 'active'
                        ? 'border-white bg-white/20 text-white'
                        : 'border-white/25 bg-black/40 text-neutral-400'
                    }`}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {nodeStatus === 'active' ? (
                        <motion.span
                          key="spin"
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          transition={{ duration: durations.micro }}
                          className="inline-flex"
                        >
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        </motion.span>
                      ) : nodeStatus === 'done' ? (
                        <motion.span
                          key="done"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{ duration: durations.micro }}
                          className="inline-flex"
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="num"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: durations.micro }}
                        >
                          {idx + 1}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  {idx < STEPS.length - 1 && (
                    <div className="relative mx-1.5 h-[2px] flex-1 overflow-hidden rounded-full bg-white/15">
                      <motion.div
                        className="h-full w-full bg-white"
                        style={{ transformOrigin: 'left' }}
                        initial={false}
                        animate={{
                          scaleX: segmentFilled ? 1 : isActive ? 0.45 : 0,
                          opacity: segmentFilled || isActive ? 1 : 0.2,
                        }}
                        transition={{ duration: durations.slow, ease: MOTION_EASING.out }}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <LayoutGroup id="autopilot-steps">
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => {
              const done = completedSteps.includes(step.id);
              const isRunningStep = activeStep === step.id;
              const isSelected = selectedStepView === step.id;
              return (
                <motion.button
                  key={step.id}
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: durations.fast, ease: MOTION_EASING.out }}
                  onClick={() => setSelectedStepView(step.id)}
                  className="glass relative flex min-h-[56px] items-start justify-between gap-2 rounded-xl px-3.5 py-2.5 text-left transition-colors hover:border-white/30"
                >
                  {isSelected && (
                    <motion.span
                      layoutId="autopilot-selected-step"
                      transition={{ layout: tabTransition }}
                      className="pointer-events-none absolute inset-0 rounded-xl border border-white/45 bg-white/15"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative z-10 min-w-0">
                    <p className="truncate text-xs font-semibold text-white">{step.title}</p>
                    <p className="truncate text-[11px] text-neutral-400">{step.subtitle}</p>
                  </div>
                  <span className="relative z-10 mt-0.5 shrink-0">
                    <AnimatePresence mode="wait" initial={false}>
                      {isRunningStep ? (
                        <motion.span
                          key="spin"
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          transition={{ duration: durations.micro }}
                          className="inline-flex"
                        >
                          <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden="true" />
                        </motion.span>
                      ) : done ? (
                        <motion.span
                          key="check"
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          transition={{ duration: durations.micro }}
                          className="inline-flex"
                        >
                          <Check className="h-4 w-4 text-white" aria-hidden="true" />
                        </motion.span>
                      ) : null}
                    </AnimatePresence>
                  </span>
                </motion.button>
              );
            })}
          </div>
        </LayoutGroup>
      </GlassCard>

      {/* Active Step Skeleton while executing first pass */}
      {activeStep && !state[selectedStepView] && (
        <ResultsSkeleton variant="script" />
      )}

      {/* Active Step Output & Actions */}
      {completedSteps.length > 0 && (
        <GlassCard className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
            <div>
              <p className="text-xs text-neutral-400">
                {STEPS.find((s) => s.id === selectedStepView)?.subtitle}
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
              <SaveActionButton
                onSave={handleSaveToLibrary}
                label="Save Pack"
                savedLabel="Saved Pack"
              />
              {state.calendar?.weeklyPlan?.length ? (
                <PrimaryButton onClick={handlePushToCalendar} className="px-3 py-1.5 text-xs">
                  <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Push to Calendar</span>
                </PrimaryButton>
              ) : null}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedStepView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: durations.fast, ease: MOTION_EASING.out }}
              className="mt-5"
            >
              {selectedStepView === 'preferences' && state.preferences && (
                <div className="space-y-3 text-sm">
                  <p className="text-white">{state.preferences.positioningSummary}</p>
                  <p className="text-xs text-neutral-300">Tone Alignment: {state.preferences.toneAlignment}</p>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-neutral-400">Content Pillars:</p>
                    <ul className="list-disc pl-5 text-sm text-neutral-200">
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
                  <p className="text-xs text-neutral-300">
                    Outcome: {state.strategy.targetOutcome} · Cadence: {state.strategy.cadenceRecommendation}
                  </p>
                </div>
              )}

              {selectedStepView === 'ideas' && state.ideas && (
                <div className="grid gap-4 md:grid-cols-2">
                  {state.ideas.map((idea) => (
                    <div key={idea.id} className="glass rounded-xl p-4 space-y-2">
                      <p className="text-xs text-neutral-400">{idea.format}</p>
                      <h3 className="text-sm font-semibold text-white">{idea.title}</h3>
                      <p className="text-xs text-neutral-300">{idea.description}</p>
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
                  <p className="text-sm text-neutral-200">Hook: {state.script.hook}</p>
                  <p className="whitespace-pre-line text-sm text-neutral-300">{state.script.fullScript}</p>
                </div>
              )}

              {selectedStepView === 'captions' && state.captions && (
                <div className="space-y-3">
                  {state.captions.map((cap, idx) => (
                    <div key={idx} className="glass rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">{cap.style}</span>
                        <CopyTextButton text={`${cap.caption}\n${cap.hashtags.join(' ')}`} />
                      </div>
                      <p className="mt-2 text-sm text-white">{cap.caption}</p>
                      <p className="mt-1 font-mono text-xs text-neutral-400">{cap.hashtags.join(' ')}</p>
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
                    <p className="text-xs text-neutral-300">{state.quality.disclaimer}</p>
                  </div>
                  <p className="text-sm text-neutral-300">{state.quality.summary}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {state.quality.metrics.map((m) => (
                      <div key={m.label} className="glass rounded-xl p-3.5">
                        <div className="flex justify-between text-xs font-medium text-white">
                          <span>{m.label}</span>
                          <span className="font-mono tabular-nums text-neutral-200">{m.score}/100</span>
                        </div>
                        <p className="mt-1 text-xs text-neutral-400">{m.fix}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedStepView === 'improve' && state.improve && (
                <div className="space-y-4">
                  <p className="text-sm text-neutral-300">{state.improve.diagnosisSummary}</p>
                  <div className="glass rounded-xl !border-white/25 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">Improved Draft</span>
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
                      className="glass flex flex-col justify-between gap-2 rounded-xl p-4 sm:flex-row sm:items-center"
                    >
                      <div>
                        <p className="text-xs text-neutral-400">
                          {slot.dayLabel} · {slot.suggestedDate} · {slot.platform} ({slot.format})
                        </p>
                        <h3 className="mt-1 text-sm font-semibold text-white">{slot.title}</h3>
                        <p className="mt-0.5 text-xs text-neutral-300">{slot.hook}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!state[selectedStepView] && (
                <p className="text-sm text-neutral-400">
                  This step has not run yet. Click Run Full Autopilot or Regenerate Step.
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </GlassCard>
      )}
    </div>
  );
}
