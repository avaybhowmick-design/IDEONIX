import { ArrowRight, Calendar, FileText, Layers, Lightbulb, Sparkles, Wand2 } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { GlassButton, GlassCard, PrimaryButton } from '../../components/ui/GlassPrimitives';
import { buildWeeklyActivitySeries, getUpcomingReminders } from '../../utils/creatorHelpers';

export function OverviewPage() {
  const {
    firebaseUser,
    demoMode,
    brandVoice,
    library,
    campaigns,
    calendar,
    activityLogs,
    setActivePage,
  } = useWorkspace();

  const displayName =
    firebaseUser?.displayName || firebaseUser?.email?.split('@')[0] || (demoMode ? 'Demo Creator' : 'Creator');

  const weeklySeries = buildWeeklyActivitySeries(activityLogs);
  const maxBar = Math.max(1, ...weeklySeries.map((d) => d.count));
  const upcoming = getUpcomingReminders(calendar).slice(0, 4);
  const recentProjects = library.slice(0, 5);
  const activeCampaigns = campaigns.filter((c) => c.status === 'Active');

  return (
    <div className="space-y-8">
      {/* Welcome & Primary Quick CTA */}
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs text-[#9ca2b8]">
            Active Brand Voice: <span className="font-medium text-violet-300">{brandVoice.preset}</span>
            <span aria-hidden="true"> · </span>
            <span>{demoMode ? 'Local Demo Mode' : 'Cloud Synced'}</span>
          </p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Welcome back, {displayName}
          </h1>
          <p className="mt-1 text-sm text-[#b8bcd0]">
            IDEONIX · From Ideas to Impact. Launch an autonomous workflow or jump into a studio.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <PrimaryButton onClick={() => setActivePage('autopilot')}>
            <Wand2 className="h-4 w-4" aria-hidden="true" />
            <span>Launch Autopilot</span>
          </PrimaryButton>
          <GlassButton onClick={() => setActivePage('calendar')}>
            <Calendar className="h-4 w-4" aria-hidden="true" />
            <span>Open Calendar</span>
          </GlassButton>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Generated Activity', value: activityLogs.length, note: 'Logged studio runs' },
          { label: 'Saved Projects', value: library.length, note: 'Items in My Library' },
          { label: 'Active Campaigns', value: activeCampaigns.length, note: `${campaigns.length} total campaigns` },
          { label: 'Upcoming Scheduled', value: upcoming.length, note: `${calendar.length} calendar entries` },
        ].map((kpi) => (
          <GlassCard key={kpi.label} subtle className="p-5">
            <p className="text-xs font-medium text-[#9ca2b8]">{kpi.label}</p>
            <p className="mt-2 font-mono text-3xl font-bold text-white tabular-nums">{kpi.value}</p>
            <p className="mt-1 text-xs text-[#7e8399]">{kpi.note}</p>
          </GlassCard>
        ))}
      </div>

      {/* Main Split: Weekly Activity Chart + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-12">
        <GlassCard className="p-6 lg:col-span-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-white">Weekly Creative Activity</h2>
              <p className="text-xs text-[#9ca2b8]">Generations logged over the past 7 days</p>
            </div>
            <span className="font-mono text-xs text-violet-300 tabular-nums">
              {weeklySeries.reduce((sum, p) => sum + p.count, 0)} runs
            </span>
          </div>

          <div className="mt-6 grid grid-cols-7 items-end gap-3 h-44 pt-4">
            {weeklySeries.map((point) => {
              const heightPct = point.count === 0 ? 8 : Math.max(16, Math.round((point.count / maxBar) * 100));
              return (
                <div key={point.dateKey} className="flex h-full flex-col items-center justify-end gap-2">
                  <span className="font-mono text-xs text-[#9ca2b8] tabular-nums">
                    {point.count}
                  </span>
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className={`w-full rounded-t-lg transition-all ${
                        point.count > 0
                          ? 'bg-gradient-to-t from-violet-600/80 to-violet-400/90'
                          : 'bg-white/[0.06]'
                      }`}
                      style={{ height: `${heightPct}%` }}
                      title={`${point.dateKey}: ${point.count} runs`}
                    />
                  </div>
                  <span className="text-xs text-[#9ca2b8]">{point.label}</span>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard subtle className="p-6 lg:col-span-5">
          <h2 className="text-base font-semibold text-white">Quick Actions</h2>
          <p className="mt-1 text-xs text-[#9ca2b8]">Jump directly to any workflow module</p>
          <div className="mt-4 space-y-2.5">
            {[
              { id: 'autopilot' as const, label: 'Run Creator Autopilot', desc: 'Idea to weekly plan in 8 linked steps', icon: Wand2 },
              { id: 'ideas' as const, label: 'Generate Video Ideas', desc: 'Hooks, formats & audience fit', icon: Lightbulb },
              { id: 'scripts' as const, label: 'Write in Script Studio', desc: 'Scene breakdowns & voiceover notes', icon: FileText },
              { id: 'campaigns' as const, label: 'Architect a Campaign', desc: 'Multi-day schedule & checklist', icon: Layers },
              { id: 'brand-voice' as const, label: 'Analyze Creator Profile', desc: 'Positioning & voice audit', icon: Sparkles },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => setActivePage(action.id)}
                  className="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-left transition-colors hover:border-violet-400/40 hover:bg-white/[0.07]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{action.label}</p>
                      <p className="truncate text-xs text-[#9ca2b8]">{action.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[#7e8399]" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* Bottom Split: Recent Projects + Upcoming Scheduled */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard subtle className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Recent Library Projects</h2>
            <button
              type="button"
              onClick={() => setActivePage('library')}
              className="text-xs font-medium text-violet-300 hover:text-violet-200"
            >
              View all
            </button>
          </div>

          {recentProjects.length === 0 ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center">
              <p className="text-sm text-[#b8bcd0]">No saved projects yet.</p>
              <p className="mt-1 text-xs text-[#7e8399]">
                Save an idea, script, or autopilot pack to see it here.
              </p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-white/10">
              {recentProjects.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActivePage('library')}
                  className="flex w-full items-start justify-between gap-3 py-3 text-left hover:bg-white/[0.02]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{item.title}</p>
                    <p className="mt-0.5 text-xs text-[#9ca2b8]">
                      {item.category} · {item.platform}
                      {item.isSample ? ' · Sample data' : ''}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-[#7e8399] tabular-nums shrink-0">
                    {item.updatedAt.slice(0, 10)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard subtle className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Upcoming Scheduled Content</h2>
            <button
              type="button"
              onClick={() => setActivePage('calendar')}
              className="text-xs font-medium text-violet-300 hover:text-violet-200"
            >
              Manage calendar
            </button>
          </div>

          {upcoming.length === 0 ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center">
              <p className="text-sm text-[#b8bcd0]">No upcoming entries scheduled.</p>
              <GlassButton onClick={() => setActivePage('calendar')} className="mt-4">
                Schedule First Post
              </GlassButton>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-white/10">
              {upcoming.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setActivePage('calendar')}
                  className="flex w-full items-start justify-between gap-3 py-3 text-left hover:bg-white/[0.02]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{entry.title}</p>
                    <p className="mt-0.5 text-xs text-[#9ca2b8]">
                      {entry.platform} · {entry.status}
                      {entry.linkedScriptTitle ? ` · Script: ${entry.linkedScriptTitle}` : ''}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-violet-300 tabular-nums shrink-0">
                    {entry.date} {entry.timeSlot}
                  </span>
                </button>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
