import React, { useState } from 'react';
import { LayoutGroup, motion } from 'motion/react';
import { CalendarPlus, CheckSquare, Plus, Square } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { generateCampaignApi } from '../../services/aiClient';
import type { CampaignPlan } from '../../types/ideonix';
import { MOTION_EASING, useMotionSettings } from '../../config/motion';
import {
  GlassButton,
  GlassCard,
  GlassSelect,
  inputClassName,
  labelClassName,
  PrimaryButton,
  ResultsSkeleton,
  SaveActionButton,
} from '../../components/ui/GlassPrimitives';

export function CampaignStudioPage() {
  const {
    brandVoice,
    campaigns,
    saveCampaign,
    updateCampaignStatus,
    saveLibraryItem,
    saveCalendarEntry,
    recordActivity,
    notify,
  } = useWorkspace();
  const { durations, tabTransition } = useMotionSettings();

  const [topic, setTopic] = useState('Zero-fluff smartphone filming mini-series');
  const [objective, setObjective] = useState('Build consistent saves and grow newsletter signups');
  const [audience, setAudience] = useState('Solo creators shooting with smartphones');
  const [durationDays, setDurationDays] = useState(5);
  const [platform, setPlatform] = useState('Instagram & YouTube');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  const [draftCampaign, setDraftCampaign] = useState<CampaignPlan | null>(
    campaigns[0] || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!topic.trim() || !objective.trim() || !audience.trim()) {
      setError('Topic, Objective, and Audience are required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await generateCampaignApi({
        topic: topic.trim(),
        objective: objective.trim(),
        audience: audience.trim(),
        durationDays,
        platform,
        startDate,
        brandVoice,
      });
      const now = new Date().toISOString();
      const newCampaign: CampaignPlan = {
        id: `camp_${Date.now()}`,
        title: result.title,
        topic: topic.trim(),
        objective: objective.trim(),
        audience: audience.trim(),
        duration: `${durationDays} days`,
        platform,
        overview: result.overview,
        status: 'Draft',
        days: result.days,
        checklist: result.checklist,
        createdAt: now,
        updatedAt: now,
      };
      setDraftCampaign(newCampaign);
      await recordActivity('campaign', result.title);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Campaign generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCampaign = async () => {
    if (!draftCampaign) return;
    const saved = await saveCampaign({
      id: draftCampaign.id,
      title: draftCampaign.title,
      topic: draftCampaign.topic,
      objective: draftCampaign.objective,
      audience: draftCampaign.audience,
      duration: draftCampaign.duration,
      platform: draftCampaign.platform,
      overview: draftCampaign.overview,
      status: draftCampaign.status === 'Completed' ? 'Completed' : 'Active',
      days: draftCampaign.days,
      checklist: draftCampaign.checklist,
    });
    setDraftCampaign(saved);
    await saveLibraryItem({
      category: 'campaign',
      title: saved.title,
      summary: saved.overview,
      platform: saved.platform,
      tags: ['campaign', saved.duration],
      payload: saved as unknown as Record<string, unknown>,
    });
  };

  const handleSyncToCalendar = async () => {
    if (!draftCampaign) return;
    for (const day of draftCampaign.days) {
      await saveCalendarEntry({
        title: day.title,
        date: day.publishDate,
        timeSlot: '18:00',
        platform: draftCampaign.platform,
        status: 'Planned',
        notes: `${day.format}\n\nIdea: ${day.idea}\n\nCaption: ${day.caption}`,
        reminderAt: '',
        linkedScriptId: '',
        linkedScriptTitle: '',
        linkedCaptionId: '',
        linkedCaptionTitle: '',
      });
    }
    notify(`Scheduled ${draftCampaign.days.length} campaign days into Content Calendar.`);
  };

  const toggleChecklist = (id: string) => {
    if (!draftCampaign) return;
    setDraftCampaign({
      ...draftCampaign,
      checklist: draftCampaign.checklist.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      ),
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-5">
        <h1 className="text-2xl font-bold text-white">Campaign Studio</h1>
        <p className="mt-1 text-sm text-neutral-300">
          Plan multi-day campaigns with editable timelines, daily scripts, captions, hashtags, and production checklists.
        </p>
      </div>

      {/* Saved Campaigns Selector */}
      {campaigns.length > 0 && (
        <LayoutGroup id="campaign-selector-tabs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-neutral-400">Saved campaigns:</span>
            {campaigns.map((c) => {
              const active = draftCampaign?.id === c.id;
              return (
                <motion.button
                  key={c.id}
                  type="button"
                  onClick={() => setDraftCampaign(c)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: durations.fast, ease: MOTION_EASING.out }}
                  className={`glass relative rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                    active ? 'text-white' : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="campaign-active-pill"
                      transition={tabTransition}
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-xl border border-white/35 bg-white/15"
                    />
                  )}
                  <span className="relative z-10">
                    {c.title} ({c.status})
                  </span>
                </motion.button>
              );
            })}
          </div>
        </LayoutGroup>
      )}

      {/* Generator Form */}
      <GlassCard className="p-6">
        <form onSubmit={handleGenerate} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2">
            <label htmlFor="camp-topic" className={labelClassName}>Campaign Topic</label>
            <input
              id="camp-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className={inputClassName}
              required
            />
          </div>
          <div>
            <label htmlFor="camp-platform" className={labelClassName}>Platform</label>
            <input
              id="camp-platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className={inputClassName}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="camp-obj" className={labelClassName}>Objective</label>
            <input
              id="camp-obj"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className={inputClassName}
              required
            />
          </div>
          <div>
            <label htmlFor="camp-audience" className={labelClassName}>Target Audience</label>
            <input
              id="camp-audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className={inputClassName}
              required
            />
          </div>
          <div>
            <label htmlFor="camp-days" className={labelClassName}>Duration (Days)</label>
            <GlassSelect
              id="camp-days"
              value={String(durationDays)}
              onChange={(v) => setDurationDays(Number(v))}
              options={[3, 5, 7, 10, 14].map((d) => ({
                value: String(d),
                label: `${d} days`,
              }))}
            />
          </div>
          <div>
            <label htmlFor="camp-start" className={labelClassName}>Start Date</label>
            <input
              id="camp-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClassName}
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap items-center gap-3 pt-2">
            <PrimaryButton type="submit" loading={loading}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Generate Campaign Plan</span>
            </PrimaryButton>
          </div>
        </form>

        {error && (
          <div role="alert" className="glass mt-4 rounded-xl px-4 py-3 text-xs text-white">
            {error}
          </div>
        )}
      </GlassCard>

      {loading ? (
        <ResultsSkeleton variant="script" />
      ) : draftCampaign ? (
        <div className="space-y-6">
          <GlassCard index={0} className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex-1 min-w-[240px]">
                <p className="text-xs text-neutral-400">
                  {draftCampaign.platform} · {draftCampaign.duration} · Status: {draftCampaign.status}
                </p>
                <input
                  aria-label="Campaign title"
                  value={draftCampaign.title}
                  onChange={(e) => setDraftCampaign({ ...draftCampaign, title: e.target.value })}
                  className="-mx-2 mt-1 w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-xl font-bold text-white transition-[border-color,box-shadow] duration-200 focus:!border-white focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {draftCampaign.status !== 'Completed' && campaigns.some((c) => c.id === draftCampaign.id) && (
                  <GlassButton
                    onClick={() => updateCampaignStatus(draftCampaign.id, 'Completed')}
                    className="!min-h-[40px] px-3 py-1.5 text-xs"
                  >
                    Mark Completed
                  </GlassButton>
                )}
                <SaveActionButton
                  onSave={handleSaveCampaign}
                  label="Save Campaign"
                  savedLabel="Saved Campaign"
                  className="!px-3 !py-1.5"
                />
                <PrimaryButton onClick={handleSyncToCalendar} className="!min-h-[40px] px-3 py-1.5 text-xs">
                  <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Schedule to Calendar</span>
                </PrimaryButton>
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="camp-overview" className={labelClassName}>Editable Campaign Overview</label>
              <textarea
                id="camp-overview"
                rows={3}
                value={draftCampaign.overview}
                onChange={(e) => setDraftCampaign({ ...draftCampaign, overview: e.target.value })}
                className={inputClassName}
              />
            </div>

            {/* Interactive Production Checklist */}
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-white">Production Checklist</h2>
              <div className="mt-3 space-y-2">
                {draftCampaign.checklist.map((item) => (
                  <motion.button
                    key={item.id}
                    type="button"
                    onClick={() => toggleChecklist(item.id)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: durations.fast, ease: MOTION_EASING.out }}
                    className="glass flex min-h-[40px] w-full items-center gap-3 rounded-xl px-3.5 py-2 text-left text-sm transition-[border-color,filter] duration-200 hover:border-white/30 hover:brightness-110"
                  >
                    {item.done ? (
                      <CheckSquare className="h-4 w-4 shrink-0 text-white" aria-hidden="true" />
                    ) : (
                      <Square className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
                    )}
                    <span className={item.done ? 'line-through text-neutral-500' : 'text-neutral-200'}>
                      {item.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Editable Daily Timeline */}
          <GlassCard index={1} className="p-6">
            <h2 className="text-base font-semibold text-white">Editable Daily Timeline</h2>
            <div className="mt-4 space-y-4">
              {draftCampaign.days.map((day, idx) => (
                <div key={day.day} className="glass rounded-xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-neutral-200">
                      Day {day.day} · {day.format}
                    </span>
                    <input
                      aria-label={`Publish date for Day ${day.day}`}
                      type="date"
                      value={day.publishDate}
                      onChange={(e) => {
                        const next = [...draftCampaign.days];
                        next[idx] = { ...day, publishDate: e.target.value };
                        setDraftCampaign({ ...draftCampaign, days: next });
                      }}
                      className="glass rounded-lg px-2.5 py-1 font-mono text-xs text-white transition-[border-color,box-shadow] duration-200 focus:!border-white focus:outline-none focus:ring-2 focus:ring-white/30"
                    />
                  </div>
                  <input
                    aria-label={`Title for Day ${day.day}`}
                    value={day.title}
                    onChange={(e) => {
                      const next = [...draftCampaign.days];
                      next[idx] = { ...day, title: e.target.value };
                      setDraftCampaign({ ...draftCampaign, days: next });
                    }}
                    className={inputClassName}
                  />
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-neutral-400">Idea & Script Outline</p>
                      <p className="mt-1 text-xs leading-relaxed text-neutral-200">{day.idea}</p>
                      <p className="mt-1 text-xs text-neutral-400">{day.scriptOutline}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-neutral-400">Caption & Hashtags</p>
                      <p className="mt-1 text-xs leading-relaxed text-neutral-200">{day.caption}</p>
                      <p className="mt-1 font-mono text-xs text-neutral-300">
                        {day.hashtags.join(' ')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      ) : null}
    </div>
  );
}
