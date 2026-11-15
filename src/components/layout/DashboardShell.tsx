import React, { useState } from 'react';
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from 'motion/react';
import {
  BookMarked,
  Calendar,
  ChevronLeft,
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
import {
  getPageVariants,
  getToastVariants,
  MOTION_EASING,
  useMotionSettings,
} from '../../config/motion';
import {
  getNavItemEntranceDelay,
  getSidebarPillTransition,
  scaleDuration,
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_EXPANDED_WIDTH,
  SIDEBAR_TIMING,
} from './sidebarMotion';
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

interface SidebarNavItemProps {
  item: {
    id: DashboardPageId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  };
  index: number;
  active: boolean;
  collapsed?: boolean;
  pillLayoutId: string;
  prefersReduced: boolean | null;
  onSelect: (id: DashboardPageId) => void;
}

function SidebarNavItem({
  item,
  index,
  active,
  collapsed = false,
  pillLayoutId,
  prefersReduced,
  onSelect,
}: SidebarNavItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = item.icon;
  const hoverDur = scaleDuration(SIDEBAR_TIMING.hoverDuration, prefersReduced);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: scaleDuration(0.28, prefersReduced),
        delay: getNavItemEntranceDelay(index, prefersReduced),
        ease: 'easeOut',
      }}
    >
      <motion.button
        type="button"
        onClick={() => onSelect(item.id)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ x: SIDEBAR_TIMING.hoverShiftX }}
        whileTap={{ scale: SIDEBAR_TIMING.tapScale }}
        transition={{ duration: hoverDur, ease: 'easeOut' }}
        title={item.label}
        aria-current={active ? 'page' : undefined}
        className="relative flex min-h-[42px] w-full items-center gap-3 rounded-xl px-[18px] py-2 text-left text-sm font-medium whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        <motion.span
          aria-hidden="true"
          initial={false}
          animate={{ opacity: isHovered && !active ? 1 : 0 }}
          transition={{ duration: hoverDur, ease: 'easeOut' }}
          className="pointer-events-none absolute inset-0 rounded-xl bg-white/[0.06]"
        />
        {active && (
          <motion.span
            layoutId={pillLayoutId}
            initial={false}
            style={{ borderRadius: 12 }}
            transition={{ layout: getSidebarPillTransition(prefersReduced) }}
            className="glass pointer-events-none absolute inset-0 rounded-xl !border-white/30 !bg-white/15"
            aria-hidden="true"
          />
        )}
        <motion.span
          initial={false}
          animate={{ scale: isHovered ? SIDEBAR_TIMING.hoverIconScale : 1 }}
          transition={{ duration: hoverDur, ease: 'easeOut' }}
          className="relative z-10 inline-flex shrink-0 items-center justify-center"
        >
          <Icon
            className={`h-4 w-4 transition-colors duration-200 ${
              active || isHovered ? 'text-white' : 'text-neutral-400'
            }`}
          />
        </motion.span>
        <motion.span
          initial={false}
          animate={{
            opacity: collapsed ? 0 : 1,
            x: collapsed ? -6 : 0,
          }}
          transition={{
            duration: scaleDuration(collapsed ? 0.14 : 0.22, prefersReduced),
            delay: collapsed ? 0 : scaleDuration(0.05, prefersReduced),
            ease: 'easeOut',
          }}
          aria-hidden={collapsed}
          className={`relative z-10 truncate transition-colors duration-200 ${
            active || isHovered ? 'text-white' : 'text-neutral-300'
          } ${collapsed ? 'pointer-events-none' : ''}`}
        >
          {item.label}
        </motion.span>
      </motion.button>
    </motion.div>
  );
}

export function DashboardShell() {
  const {
    activePage,
    setActivePage,
    firebaseUser,
    brandVoice,
    logout,
    toastMessage,
    clearToast,
  } = useWorkspace();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signOutHovered, setSignOutHovered] = useState(false);
  const prefersReduced = useReducedMotion();
  const { durations } = useMotionSettings();
  const pageVariants = getPageVariants(durations.base);
  const toastVariants = getToastVariants(durations.base);

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
    <div className="flex min-h-[100dvh] text-neutral-100">
        {/* Desktop Collapsible Sidebar */}
        <motion.aside
          aria-label="Workspace navigation"
          initial={{
            x: SIDEBAR_TIMING.entranceX,
            opacity: 0,
            width: SIDEBAR_EXPANDED_WIDTH,
          }}
          animate={{
            x: 0,
            opacity: 1,
            width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH,
          }}
          transition={{
            x: {
              duration: scaleDuration(SIDEBAR_TIMING.entranceDuration, prefersReduced),
              ease: [0.22, 1, 0.36, 1],
            },
            opacity: {
              duration: scaleDuration(SIDEBAR_TIMING.entranceDuration, prefersReduced),
              ease: 'easeOut',
            },
            width: {
              duration: scaleDuration(SIDEBAR_TIMING.collapseDuration, prefersReduced),
              ease: [0.22, 1, 0.36, 1],
            },
          }}
          className="glass hidden lg:flex flex-col overflow-hidden rounded-none border-y-0 border-l-0 shrink-0"
        >
          <div className="relative flex h-16 items-center justify-end border-b border-white/15 px-[18px]">
            <motion.div
              initial={false}
              animate={{
                opacity: collapsed ? 0 : 1,
                x: collapsed ? -8 : 0,
              }}
              transition={{
                duration: scaleDuration(collapsed ? 0.14 : 0.22, prefersReduced),
                delay: collapsed ? 0 : scaleDuration(0.05, prefersReduced),
                ease: 'easeOut',
              }}
              aria-hidden={collapsed}
              className={`absolute left-4 ${collapsed ? 'pointer-events-none' : ''}`}
            >
              <BrandWordmark shimmer />
            </motion.div>
            <motion.button
              type="button"
              whileTap={{ scale: SIDEBAR_TIMING.tapScale }}
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="glass relative z-10 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-neutral-300 transition-colors hover:text-white"
            >
              <motion.span
                initial={false}
                animate={{ rotate: collapsed ? SIDEBAR_TIMING.collapseArrowRotate : 0 }}
                transition={{
                  duration: scaleDuration(SIDEBAR_TIMING.collapseDuration, prefersReduced),
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="inline-flex items-center justify-center"
              >
                <ChevronLeft className="h-4 w-4" />
              </motion.span>
            </motion.button>
          </div>

          <LayoutGroup id="desktop-sidebar-nav">
            <nav className="flex-1 space-y-1 overflow-x-hidden overflow-y-auto p-3">
              {NAV_ITEMS.map((item, idx) => (
                <SidebarNavItem
                  key={item.id}
                  item={item}
                  index={idx}
                  active={activePage === item.id}
                  collapsed={collapsed}
                  pillLayoutId="sidebar-active-pill"
                  prefersReduced={prefersReduced}
                  onSelect={handleSelectPage}
                />
              ))}
            </nav>
          </LayoutGroup>

          <div className="border-t border-white/15 p-3 space-y-1">
            {firebaseUser && (
              <motion.div
                initial={false}
                animate={{
                  opacity: collapsed ? 0 : 1,
                  x: collapsed ? -6 : 0,
                }}
                transition={{
                  duration: scaleDuration(collapsed ? 0.14 : 0.22, prefersReduced),
                  ease: 'easeOut',
                }}
                aria-hidden={collapsed}
                className={`overflow-hidden px-3 py-1.5 text-xs ${
                  collapsed ? 'pointer-events-none' : ''
                }`}
              >
                <p className="truncate font-medium text-white">
                  {firebaseUser.displayName || 'Creator'}
                </p>
                <p className="truncate text-[11px] text-neutral-400">{firebaseUser.email}</p>
              </motion.div>
            )}
            <motion.button
              type="button"
              onClick={logout}
              onMouseEnter={() => setSignOutHovered(true)}
              onMouseLeave={() => setSignOutHovered(false)}
              whileTap={{ scale: SIDEBAR_TIMING.tapScale }}
              title="Sign Out"
              className="relative flex min-h-[42px] w-full items-center gap-3 rounded-xl px-[18px] py-2 text-left text-sm font-medium whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <motion.span
                aria-hidden="true"
                initial={false}
                animate={{ opacity: signOutHovered ? 1 : 0 }}
                transition={{
                  duration: scaleDuration(SIDEBAR_TIMING.hoverDuration, prefersReduced),
                  ease: 'easeOut',
                }}
                className="pointer-events-none absolute inset-0 rounded-xl bg-white/[0.06]"
              />
              <motion.span
                initial={false}
                animate={{ x: signOutHovered ? SIDEBAR_TIMING.signOutArrowNudgeX : 0 }}
                transition={{
                  duration: scaleDuration(SIDEBAR_TIMING.hoverDuration, prefersReduced),
                  ease: 'easeOut',
                }}
                className="relative z-10 inline-flex shrink-0 items-center justify-center"
              >
                <LogOut
                  className={`h-4 w-4 transition-colors duration-200 ${
                    signOutHovered ? 'text-[#ffd4d4]' : 'text-neutral-400'
                  }`}
                  aria-hidden="true"
                />
              </motion.span>
              <motion.span
                initial={false}
                animate={{
                  opacity: collapsed ? 0 : 1,
                  x: collapsed ? -6 : 0,
                }}
                transition={{
                  duration: scaleDuration(collapsed ? 0.14 : 0.22, prefersReduced),
                  delay: collapsed ? 0 : scaleDuration(0.05, prefersReduced),
                  ease: 'easeOut',
                }}
                aria-hidden={collapsed}
                className={`relative z-10 truncate transition-colors duration-200 ${
                  signOutHovered ? 'text-[#ffd4d4]' : 'text-neutral-300'
                } ${collapsed ? 'pointer-events-none' : ''}`}
              >
                Sign Out
              </motion.span>
            </motion.button>
          </div>
        </motion.aside>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <div className="fixed inset-0 z-50 flex lg:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: scaleDuration(0.2, prefersReduced) }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => setMobileOpen(false)}
              />
              <motion.aside
                initial={{ x: -288, opacity: 0.9 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -288, opacity: 0.9 }}
                transition={{
                  duration: scaleDuration(0.28, prefersReduced),
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="glass relative z-10 flex w-72 flex-col rounded-r-2xl p-4"
              >
                <div className="flex items-center justify-between border-b border-white/15 pb-4">
                  <BrandWordmark shimmer />
                  <motion.button
                    type="button"
                    whileTap={{ scale: SIDEBAR_TIMING.tapScale }}
                    aria-label="Close navigation menu"
                    onClick={() => setMobileOpen(false)}
                    className="glass inline-flex h-11 w-11 items-center justify-center rounded-xl text-neutral-300 hover:text-white"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </motion.button>
                </div>
                <LayoutGroup id="mobile-sidebar-nav">
                  <nav className="mt-3 flex-1 space-y-1 overflow-x-hidden overflow-y-auto">
                    {NAV_ITEMS.map((item, idx) => (
                      <SidebarNavItem
                        key={item.id}
                        item={item}
                        index={idx}
                        active={activePage === item.id}
                        pillLayoutId="mobile-sidebar-active-pill"
                        prefersReduced={prefersReduced}
                        onSelect={handleSelectPage}
                      />
                    ))}
                  </nav>
                </LayoutGroup>
                <motion.button
                  type="button"
                  onClick={logout}
                  onMouseEnter={() => setSignOutHovered(true)}
                  onMouseLeave={() => setSignOutHovered(false)}
                  whileTap={{ scale: SIDEBAR_TIMING.tapScale }}
                  className="mt-3 relative flex min-h-[44px] w-full items-center gap-3 rounded-xl border-t border-white/15 px-[18px] pt-3 text-sm font-medium"
                >
                  <motion.span
                    initial={false}
                    animate={{ x: signOutHovered ? SIDEBAR_TIMING.signOutArrowNudgeX : 0 }}
                    transition={{
                      duration: scaleDuration(SIDEBAR_TIMING.hoverDuration, prefersReduced),
                      ease: 'easeOut',
                    }}
                    className="inline-flex shrink-0 items-center justify-center"
                  >
                    <LogOut
                      className={`h-4 w-4 transition-colors duration-200 ${
                        signOutHovered ? 'text-[#ffd4d4]' : 'text-neutral-400'
                      }`}
                      aria-hidden="true"
                    />
                  </motion.span>
                  <span
                    className={`transition-colors duration-200 ${
                      signOutHovered ? 'text-[#ffd4d4]' : 'text-neutral-300'
                    }`}
                  >
                    Sign Out
                  </span>
                </motion.button>
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-20 flex h-16 items-center justify-between gap-4 rounded-none border-x-0 border-t-0 px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <motion.button
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: durations.fast, ease: MOTION_EASING.out }}
              aria-label="Open navigation menu"
              onClick={() => setMobileOpen(true)}
              className="glass inline-flex h-11 w-11 items-center justify-center rounded-xl text-neutral-300 hover:border-white/30 hover:text-white lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </motion.button>
            <span className="truncate text-sm font-semibold text-white">
              IDEONIX / {currentNav.label}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-neutral-400 shrink-0">
            <motion.button
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: durations.fast, ease: MOTION_EASING.out }}
              onClick={() => setActivePage('brand-voice')}
              className="hidden sm:inline-block hover:text-white whitespace-nowrap"
            >
              Voice: <span className="font-medium text-white">{brandVoice.preset}</span>
            </motion.button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-7 pb-24 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Persistent Global AI Creator Assistant */}
      <AssistantDrawer />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            key={toastMessage.text}
            role="status"
            variants={toastVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`glass fixed bottom-5 left-5 z-50 flex max-w-sm items-center justify-between gap-3 rounded-xl px-4 py-3 text-xs text-white ${
              toastMessage.type === 'error' ? '!border-white/40 !bg-white/15' : ''
            }`}
          >
            <span>{toastMessage.text}</span>
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              aria-label="Dismiss message"
              onClick={clearToast}
              className="text-neutral-300 hover:text-white"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
