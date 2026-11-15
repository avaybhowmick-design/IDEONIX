import { Download, LogOut, Mail, RotateCcw } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { GlassButton, GlassCard } from '../../components/ui/GlassPrimitives';

export function SettingsPage() {
  const {
    firebaseUser,
    demoMode,
    storageMode,
    brandVoice,
    library,
    campaigns,
    calendar,
    resendVerificationEmail,
    resetDemoData,
    logout,
    setView,
  } = useWorkspace();

  const handleExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      mode: storageMode,
      brandVoice,
      library,
      campaigns,
      calendar,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ideonix-workspace-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-5">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-[#b8bcd0]">
          Account identity, cloud persistence status, data export, and session controls.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <GlassCard className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-white">Account & Persistence</h2>
          <div className="space-y-2 text-sm text-[#b8bcd0]">
            <p>
              <span className="text-[#7e8399]">Mode: </span>
              <span className="font-medium text-white">
                {storageMode === 'firebase' ? 'Firebase Cloud Firestore' : 'Local Demo Mode (localStorage)'}
              </span>
            </p>
            {firebaseUser ? (
              <>
                <p>
                  <span className="text-[#7e8399]">Signed in as: </span>
                  <span className="text-white">{firebaseUser.displayName || firebaseUser.email}</span>
                </p>
                <p>
                  <span className="text-[#7e8399]">Email Verified: </span>
                  <span className={firebaseUser.emailVerified ? 'text-violet-300' : 'text-amber-300'}>
                    {firebaseUser.emailVerified ? 'Verified' : 'Pending verification'}
                  </span>
                </p>
              </>
            ) : (
              <p className="text-xs text-[#9ca2b8]">
                Currently exploring without Firebase login. Sign in with Google or Email to sync across devices.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {firebaseUser && !firebaseUser.emailVerified && (
              <GlassButton onClick={resendVerificationEmail}>
                <Mail className="h-4 w-4 text-violet-300" aria-hidden="true" />
                <span>Resend Verification Email</span>
              </GlassButton>
            )}
            {demoMode && !firebaseUser && (
              <GlassButton onClick={() => setView('login')}>
                <span>Sign In to Sync Cloud</span>
              </GlassButton>
            )}
            <GlassButton onClick={logout}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>{firebaseUser ? 'Sign Out' : 'Exit Demo'}</span>
            </GlassButton>
          </div>
        </GlassCard>

        <GlassCard subtle className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-white">Workspace Data</h2>
          <p className="text-xs leading-relaxed text-[#b8bcd0]">
            Export your saved library items, campaigns, brand voice configuration, and calendar
            entries as JSON, or restore the sample local demo workspace.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <GlassButton onClick={handleExport}>
              <Download className="h-4 w-4 text-violet-300" aria-hidden="true" />
              <span>Export Workspace JSON</span>
            </GlassButton>
            {storageMode === 'demo' && (
              <GlassButton onClick={resetDemoData}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>Reset Demo Sample Data</span>
              </GlassButton>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
