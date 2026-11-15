import React, { useMemo, useState } from 'react';
import { Bell, ChevronLeft, ChevronRight, Info, Plus, Trash2 } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import type { CalendarEntry, CalendarStatus } from '../../types/ideonix';
import {
  GlassButton,
  GlassCard,
  inputClassName,
  labelClassName,
  PrimaryButton,
} from '../../components/ui/GlassPrimitives';
import { getMonthGridDays, getUpcomingReminders, getWeekDates } from '../../utils/creatorHelpers';

type CalendarViewMode = 'month' | 'week' | 'day';

export function CalendarPage() {
  const {
    calendar,
    library,
    saveCalendarEntry,
    updateCalendarStatus,
    deleteCalendarEntry,
    notify,
  } = useWorkspace();

  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [anchorDate, setAnchorDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(anchorDate);
  const [timeSlot, setTimeSlot] = useState('18:00');
  const [platform, setPlatform] = useState('Instagram Reels');
  const [status, setStatus] = useState<CalendarStatus>('Planned');
  const [notes, setNotes] = useState('');
  const [reminderAt, setReminderAt] = useState('');
  const [linkedScriptId, setLinkedScriptId] = useState('');
  const [linkedCaptionId, setLinkedCaptionId] = useState('');

  const scriptItems = useMemo(
    () => library.filter((i) => i.category === 'script'),
    [library]
  );
  const captionItems = useMemo(
    () => library.filter((i) => i.category === 'caption'),
    [library]
  );

  const [yearNum, monthNum] = anchorDate.split('-').map(Number);
  const monthGrid = useMemo(() => getMonthGridDays(yearNum, monthNum - 1), [yearNum, monthNum]);
  const weekDates = useMemo(() => getWeekDates(anchorDate), [anchorDate]);
  const reminders = useMemo(() => getUpcomingReminders(calendar), [calendar]);

  const monthLabel = new Date(Date.UTC(yearNum, monthNum - 1, 1)).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const openNewForm = (presetDate?: string) => {
    setEditingId(undefined);
    setTitle('');
    setDate(presetDate || anchorDate);
    setTimeSlot('18:00');
    setPlatform('Instagram Reels');
    setStatus('Planned');
    setNotes('');
    setReminderAt('');
    setLinkedScriptId('');
    setLinkedCaptionId('');
    setShowForm(true);
  };

  const openEditForm = (entry: CalendarEntry) => {
    setEditingId(entry.id);
    setTitle(entry.title);
    setDate(entry.date);
    setTimeSlot(entry.timeSlot);
    setPlatform(entry.platform);
    setStatus(entry.status);
    setNotes(entry.notes);
    setReminderAt(entry.reminderAt);
    setLinkedScriptId(entry.linkedScriptId);
    setLinkedCaptionId(entry.linkedCaptionId);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      notify('Title and Date are required.', 'error');
      return;
    }

    const scriptObj = scriptItems.find((s) => s.id === linkedScriptId);
    const captionObj = captionItems.find((c) => c.id === linkedCaptionId);

    await saveCalendarEntry({
      id: editingId,
      title: title.trim(),
      date,
      timeSlot,
      platform,
      status,
      notes,
      reminderAt,
      linkedScriptId,
      linkedScriptTitle: scriptObj?.title || '',
      linkedCaptionId,
      linkedCaptionTitle: captionObj?.title || '',
    });

    setShowForm(false);
  };

  const shiftAnchor = (delta: number) => {
    const [y, m, d] = anchorDate.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (viewMode === 'month') dt.setUTCMonth(dt.getUTCMonth() + delta);
    else if (viewMode === 'week') dt.setUTCDate(dt.getUTCDate() + delta * 7);
    else dt.setUTCDate(dt.getUTCDate() + delta);
    setAnchorDate(dt.toISOString().slice(0, 10));
  };

  const renderEntryCard = (entry: CalendarEntry) => {
    const isPublished = entry.status === 'Published';
    return (
      <div
        key={entry.id}
        className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs space-y-2"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">{entry.title}</p>
            <p className="text-[11px] text-[#9ca2b8]">
              {entry.timeSlot} · {entry.platform}
              {entry.isSample ? ' · Sample data' : ''}
            </p>
          </div>
          <select
            aria-label={`Status for ${entry.title}`}
            value={entry.status}
            disabled={isPublished}
            onChange={(e) => updateCalendarStatus(entry.id, e.target.value as CalendarStatus)}
            className="rounded-lg border border-white/10 bg-[#0c0d16] px-2 py-1 text-[11px] text-white disabled:opacity-60"
          >
            <option value="Draft">Draft</option>
            <option value="Planned">Planned</option>
            <option value="Published">Published</option>
          </select>
        </div>

        {(entry.linkedScriptTitle || entry.linkedCaptionTitle) && (
          <div className="text-[11px] text-violet-300 space-y-0.5">
            {entry.linkedScriptTitle && <p className="truncate">Script: {entry.linkedScriptTitle}</p>}
            {entry.linkedCaptionTitle && <p className="truncate">Caption: {entry.linkedCaptionTitle}</p>}
          </div>
        )}

        {entry.reminderAt && (
          <p className="flex items-center gap-1 text-[11px] text-amber-300">
            <Bell className="h-3 w-3" aria-hidden="true" />
            <span>Reminder: {entry.reminderAt.replace('T', ' ')}</span>
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          {!isPublished && (
            <button
              type="button"
              onClick={() => openEditForm(entry)}
              className="text-[11px] font-medium text-[#b8bcd0] hover:text-white"
            >
              Edit
            </button>
          )}
          <button
            type="button"
            aria-label={`Delete "${entry.title}"`}
            onClick={() => deleteCalendarEntry(entry.id)}
            className="inline-flex items-center gap-1 text-[11px] text-rose-300 hover:text-rose-200"
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Calendar</h1>
          <p className="mt-1 text-sm text-[#b8bcd0]">
            Plan monthly, weekly, and daily drops with linked scripts, captions, and reminders.
          </p>
        </div>
        <PrimaryButton onClick={() => openNewForm()}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Schedule Entry</span>
        </PrimaryButton>
      </div>

      {/* Honest integration disclosure */}
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs text-[#b8bcd0]">
        <Info className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
        <span>
          Planning & reminder workspace only — IDEONIX does not auto-publish directly to external social platforms.
        </span>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <GlassButton
            aria-label="Previous period"
            onClick={() => shiftAnchor(-1)}
            className="px-3 py-2"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </GlassButton>
          <span className="min-w-[150px] text-center text-sm font-semibold text-white">
            {viewMode === 'month' ? monthLabel : anchorDate}
          </span>
          <GlassButton
            aria-label="Next period"
            onClick={() => shiftAnchor(1)}
            className="px-3 py-2"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </GlassButton>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1">
          {(['month', 'week', 'day'] as CalendarViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                viewMode === mode
                  ? 'bg-violet-600 text-white'
                  : 'text-[#b8bcd0] hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Add / Edit Form Modal/Panel */}
      {showForm && (
        <GlassCard className="p-6" withRefraction>
          <h2 className="text-base font-semibold text-white">
            {editingId ? 'Edit Calendar Entry' : 'New Calendar Entry'}
          </h2>
          <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2">
              <label htmlFor="cal-title" className={labelClassName}>Post Title</label>
              <input
                id="cal-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClassName}
                placeholder="e.g. One-Light Studio Setup Reel"
                required
              />
            </div>
            <div>
              <label htmlFor="cal-platform" className={labelClassName}>Platform</label>
              <select
                id="cal-platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className={inputClassName}
              >
                <option>Instagram Reels</option>
                <option>YouTube Shorts</option>
                <option>YouTube Long-form</option>
                <option>LinkedIn</option>
                <option>Facebook</option>
                <option>X</option>
              </select>
            </div>
            <div>
              <label htmlFor="cal-date" className={labelClassName}>Publish Date</label>
              <input
                id="cal-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClassName}
                required
              />
            </div>
            <div>
              <label htmlFor="cal-time" className={labelClassName}>Time Slot</label>
              <input
                id="cal-time"
                type="time"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="cal-reminder" className={labelClassName}>Reminder</label>
              <input
                id="cal-reminder"
                type="datetime-local"
                value={reminderAt}
                onChange={(e) => setReminderAt(e.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="cal-script" className={labelClassName}>Link Saved Script</label>
              <select
                id="cal-script"
                value={linkedScriptId}
                onChange={(e) => setLinkedScriptId(e.target.value)}
                className={inputClassName}
              >
                <option value="">None</option>
                {scriptItems.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="cal-caption" className={labelClassName}>Link Saved Caption</label>
              <select
                id="cal-caption"
                value={linkedCaptionId}
                onChange={(e) => setLinkedCaptionId(e.target.value)}
                className={inputClassName}
              >
                <option value="">None</option>
                {captionItems.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            {!editingId && (
              <div>
                <label htmlFor="cal-status" className={labelClassName}>Initial Status</label>
                <select
                  id="cal-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CalendarStatus)}
                  className={inputClassName}
                >
                  <option value="Draft">Draft</option>
                  <option value="Planned">Planned</option>
                  <option value="Published">Published</option>
                </select>
              </div>
            )}
            <div className="sm:col-span-2 lg:col-span-3">
              <label htmlFor="cal-notes" className={labelClassName}>Production Notes</label>
              <textarea
                id="cal-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputClassName}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-3">
              <PrimaryButton type="submit">
                {editingId ? 'Save Changes' : 'Add to Calendar'}
              </PrimaryButton>
              <GlassButton onClick={() => setShowForm(false)}>Cancel</GlassButton>
            </div>
          </form>
        </GlassCard>
      )}

      {/* Calendar Views */}
      {viewMode === 'month' && (
        <GlassCard subtle className="p-4 sm:p-5 overflow-x-auto">
          <p className="mb-2 text-[11px] text-[#9ca2b8] sm:hidden">
            Swipe grid or switch to Week / Day view above.
          </p>
          <div className="min-w-[680px]">
            <div className="grid grid-cols-7 gap-2 pb-2 text-center text-xs font-medium text-[#9ca2b8]">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {monthGrid.map((cell) => {
                const items = calendar.filter((e) => e.date === cell.dateStr);
                return (
                  <div
                    key={cell.dateStr}
                    className={`min-h-[108px] rounded-xl border p-2 ${
                      cell.inMonth
                        ? 'border-white/10 bg-white/[0.02]'
                        : 'border-white/5 bg-transparent opacity-45'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-[#b8bcd0] tabular-nums">
                        {cell.dayNumber}
                      </span>
                      <button
                        type="button"
                        aria-label={`Schedule on ${cell.dateStr}`}
                        onClick={() => openNewForm(cell.dateStr)}
                        className="rounded p-0.5 text-[#7e8399] hover:bg-white/10 hover:text-white"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="mt-1.5 space-y-1">
                      {items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setAnchorDate(cell.dateStr);
                            setViewMode('day');
                          }}
                          className="block w-full truncate rounded-md border border-violet-400/25 bg-violet-500/15 px-1.5 py-1 text-left text-[11px] font-medium text-white hover:bg-violet-500/25"
                        >
                          {item.timeSlot} {item.title}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </GlassCard>
      )}

      {viewMode === 'week' && (
        <div className="grid gap-4 md:grid-cols-7">
          {weekDates.map((d) => {
            const items = calendar.filter((e) => e.date === d);
            return (
              <GlassCard key={d} subtle className="p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-mono text-xs font-semibold text-white tabular-nums">{d}</span>
                  <button
                    type="button"
                    aria-label={`Add post on ${d}`}
                    onClick={() => openNewForm(d)}
                    className="text-[#9ca2b8] hover:text-white"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
                {items.length === 0 ? (
                  <p className="text-[11px] text-[#7e8399]">No posts</p>
                ) : (
                  <div className="space-y-2">{items.map(renderEntryCard)}</div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}

      {viewMode === 'day' && (
        <GlassCard subtle className="p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="font-mono text-base font-semibold text-white tabular-nums">
              Schedule for {anchorDate}
            </h2>
            <GlassButton onClick={() => openNewForm(anchorDate)} className="px-3 py-1.5 text-xs">
              Add Entry on This Day
            </GlassButton>
          </div>
          <div className="mt-4 space-y-3">
            {calendar.filter((e) => e.date === anchorDate).length === 0 ? (
              <p className="text-sm text-[#9ca2b8]">No posts scheduled on {anchorDate}.</p>
            ) : (
              calendar.filter((e) => e.date === anchorDate).map(renderEntryCard)
            )}
          </div>
        </GlassCard>
      )}

      {/* Upcoming Reminders List */}
      <GlassCard subtle className="p-6">
        <h2 className="text-base font-semibold text-white">Upcoming Queue & Reminders</h2>
        {reminders.length === 0 ? (
          <p className="mt-2 text-xs text-[#9ca2b8]">No upcoming Draft or Planned posts.</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {reminders.map(renderEntryCard)}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
