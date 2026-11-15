import React, { useState } from 'react';
import {
  BookMarked,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Gauge,
  LayoutDashboard,
  Layers,
  Lightbulb,
  LogOut,
  Menu,
  MessageSquareQuote,
  Mic2,
  Repeat,
  Settings,
  Stethoscope,
  Wand2,
  X,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import type { DashboardPageId } from '../../types/ideonix';
import { BrandWordmark } from '../ui/GlassPrimitives';
import { AssistantDrawer } from './AssistantDrawer';
import { OverviewPage } from '../../pages/dashboard/OverviewPage';
import { AutopilotPage } from '../../pages/dashboard/AutopilotPage';
import { IdeaGeneratorPage } from '../../pages/dashboard/IdeaGeneratorPage';
import { ScriptStudioPage } from '../../pages/dashboard/ScriptStudioPage';
import { CaptionStudioPage } from '../../pages/dashboard/CaptionStudioPage';
import { RepurposerPage } from '../../pages/dashboard/RepurposerPage';
import { ViralAnalyzerPage } from '../../pages/dashboard/ViralAnalyzerPage';
import { ContentDoctorPage } from '../../pages/dashboard/ContentDoctorPage';
import { CampaignStudioPage } from '../../pages/dashboard/CampaignStudioPage';
import { CalendarPage } from '../../pages/dashboard/CalendarPage';
import { LibraryPage } from '../../pages/dashboard/LibraryPage';
import { BrandVoicePage } from '../../pages/dashboard/BrandVoicePage';
import { SettingsPage } from '../../pages/dashboard/SettingsPage';

const NAV_ITEMS: Array<{
  id: DashboardPageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'autopilot', label: 'Creator Autopilot', icon: Wand2 },
  { id: 'ideas', label: 'AI Idea Generator', icon: Lightbulb },
  { id: 'scripts', label: 'Script Studio', icon: FileText },
  { id: 'captions', label: 'Caption Studio', icon: MessageSquareQuote },
  { id: 'repurposer', label: 'Content Repurposer', icon: Repeat },
  { id: 'viral', label: 'Viral Analyzer', icon: Gauge },
  { id: 'doctor', label: 'Content Doctor', icon: Stethoscope },
  { id: 'campaigns', label: 'Campaign Studio', icon: Layers },
  { id: 'calendar', label: 'Content Calendar', icon: Calendar },
  { id: 'library', label: 'My Library', icon: BookMarked },
  { id: 'brand-voice', label: 'Brand Voice', icon: Mic2 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function DashboardShell() {
  const {
    activePage,
    setActivePage,
    firebaseUser,
    demoMode,
    brandVoice,
    logout,
    toastMessage,
    clearToast,
  } = useWorkspace();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentNav = NAV_ITEMS.find((n) => n.id === activePage) || NAV_ITEMS[0];

  const handleSelectPage = (id: DashboardPageId) => {
    setActivePage(id);
    setMobileOpen(false);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'overview':
        return <OverviewPage />;
      case 'autopilot':
        return <AutopilotPage />;
      case 'ideas':
        return <IdeaGeneratorPage />;
      case 'scripts':
        return <ScriptStudioPage />;
      case 'captions':
        return <CaptionStudioPage />;
      case 'repurposer':
        return <RepurposerPage />;
      case 'viral':
        return <ViralAnalyzerPage />;
      case 'doctor':
        return <ContentDoctorPage />;
      case 'campaigns':
        return <CampaignStudioPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'library':
        return <LibraryPage />;
      case 'brand-voice':
        return <BrandVoicePage />;
      case 'settings':
        return <SettingsPage />;
    }
  };

  return (
    <div className="flex min-h-[100dvh] bg-[#07070b] text-[#f4f4f8]">
      {/* Desktop Collapsible Sidebar */}
      <aside
        aria-label="Workspace navigation"
        className={`hidden lg:flex flex-col border-r border-white/10 bg-[#0b0c13]/90 backdrop-blur-xl transition-all duration-200 ${
          collapsed ? 'w-[76px]' : 'w-[256px]'
        } shrink-0`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          {!collapsed && <BrandWordmark />}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#b8bcd0] hover:text-white"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectPage(item.id)}
                title={item.label}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[42px] w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-violet-600/25 text-white border border-violet-400/35'
                    : 'text-[#b8bcd0] hover:bg-white/[0.05] hover:text-white border border-transparent'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-violet-300' : 'text-[#9ca2b8]'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={logout}
            title="Sign Out"
            className="flex min-h-[42px] w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[#b8bcd0] hover:bg-white/[0.05] hover:text-white"
          >
            <LogOut className="h-4 w-4 shrink-0 text-[#9ca2b8]" aria-hidden="true" />
            {!collapsed && <span>{firebaseUser ? 'Sign Out' : 'Exit Demo'}</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 flex w-72 flex-col border-r border-white/10 bg-[#0b0c13] p-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <BrandWordmark />
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-[#b8bcd0]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <nav className="mt-3 flex-1 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectPage(item.id)}
                    className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${
                      active
                        ? 'bg-violet-600/25 text-white border border-violet-400/35'
                        : 'text-[#b8bcd0] hover:bg-white/[0.05] hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <button
              type="button"
              onClick={logout}
              className="mt-3 flex min-h-[44px] w-full items-center gap-3 rounded-xl border-t border-white/10 px-3 pt-3 text-sm font-medium text-[#b8bcd0]"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>{firebaseUser ? 'Sign Out' : 'Exit Demo'}</span>
            </button>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-white/10 bg-[#07070b]/80 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#b8bcd0] lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="truncate text-sm font-semibold text-white">
              IDEONIX / {currentNav.label}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#9ca2b8] shrink-0">
            <button
              type="button"
              onClick={() => setActivePage('brand-voice')}
              className="hidden sm:inline-block hover:text-white whitespace-nowrap"
            >
              Voice: <span className="text-violet-300 font-medium">{brandVoice.preset}</span>
            </button>
            {demoMode && !firebaseUser && (
              <span className="text-amber-300 font-medium whitespace-nowrap">
                Local Demo Mode
              </span>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-7 pb-24 sm:px-6 lg:px-8">
          {renderPage()}
        </main>
      </div>

      {/* Persistent Global AI Creator Assistant */}
      <AssistantDrawer />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className={`fixed bottom-5 left-5 z-50 flex max-w-sm items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs shadow-2xl backdrop-blur-xl ${
            toastMessage.type === 'error'
              ? 'border-rose-400/40 bg-rose-950/90 text-rose-100'
              : 'border-violet-400/40 bg-[#121320]/95 text-white'
          }`}
        >
          <span>{toastMessage.text}</span>
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={clearToast}
            className="text-[#b8bcd0] hover:text-white"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
