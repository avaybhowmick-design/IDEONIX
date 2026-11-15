import { useEffect } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import WaveCanvasBackground from './components/ui/WaveCanvasBackground';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardShell } from './components/layout/DashboardShell';
import { getPageVariants, useMotionSettings } from './config/motion';

function IdeonixRouter() {
  const { view, authLoading, firebaseUser } = useWorkspace();
  const { durations } = useMotionSettings();

  if (authLoading && view === 'dashboard') {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center text-sm text-neutral-300">
        Loading IDEONIX workspace...
      </div>
    );
  }

  const effectiveView =
    view === 'dashboard' && !firebaseUser ? 'login' : view;

  const pageVariants = getPageVariants(durations.base);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={effectiveView}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {effectiveView === 'login' ? (
          <LoginPage />
        ) : effectiveView === 'dashboard' ? (
          <DashboardShell />
        ) : (
          <LandingPage />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  useEffect(() => {
    const ua = navigator.userAgent;
    const isChromium = /Chrome|Chromium|Edg/.test(ua) && !/OPR|Opera/.test(ua);
    if (isChromium) {
      document.documentElement.classList.add('is-chromium');
    }
  }, []);

  return (
    <MotionConfig reducedMotion="never">
      <svg className="absolute w-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <filter id="liquid-glass" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.008" numOctaves="3" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="1.5" result="blurred" />
          <feDisplacementMap in="SourceGraphic" in2="blurred" scale="45" xChannelSelector="R" yChannelSelector="G" result="displacement" />
        </filter>
      </svg>
      <WaveCanvasBackground />
      <WorkspaceProvider>
        <IdeonixRouter />
      </WorkspaceProvider>
    </MotionConfig>
  );
}
