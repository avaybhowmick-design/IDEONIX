import { MotionConfig } from 'motion/react';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import { LiquidRefractionFilter } from './components/ui/LiquidRefractionFilter';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardShell } from './components/layout/DashboardShell';

function IdeonixRouter() {
  const { view, authLoading } = useWorkspace();

  if (authLoading && view === 'dashboard') {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#07070b] text-sm text-[#b8bcd0]">
        Loading IDEONIX workspace...
      </div>
    );
  }

  if (view === 'login') return <LoginPage />;
  if (view === 'dashboard') return <DashboardShell />;
  return <LandingPage />;
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <LiquidRefractionFilter />
      <WorkspaceProvider>
        <IdeonixRouter />
      </WorkspaceProvider>
    </MotionConfig>
  );
}
