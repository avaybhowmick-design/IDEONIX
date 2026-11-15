import { Download, LogOut, Mail } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { GlassButton, GlassCard } from '../../components/ui/GlassPrimitives';

export function SettingsPage() {
  const {
    firebaseUser,
    brandVoice,
    library,
    campaigns,
    calendar,
    resendVerificationEmail,
    logout,
  } = useWorkspace();

  const handleExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      mode: 'firebase',
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
        <p className="mt-1 text-sm text-neutral-300">
          Account identity, cloud persistence status, data export, and session controls.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <GlassCard index={0} className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-white">Account & Persistence</h2>
          <div className="space-y-2 text-sm text-neutral-300">
            <p>
              <span className="text-neutral-400">Database: </span>
              <span className="font-medium text-white">Firebase Cloud Firestore</span>
            </p>
            {firebaseUser && (
              <>
                <p>
                  <span className="text-neutral-400">Signed in as: </span>
                  <span className="text-white">{firebaseUser.displayName || firebaseUser.email}</span>
                </p>
                {firebaseUser.email && (
                  <p>
                    <span className="text-neutral-400">Email: </span>
                    <span className="text-white">{firebaseUser.email}</span>
                  </p>
                )}
                <p>
                  <span className="text-neutral-400">Email Verified: </span>
                  <span className={firebaseUser.emailVerified ? 'text-white' : 'text-neutral-300'}>
                    {firebaseUser.emailVerified ? 'Verified' : 'Pending verification'}
                  </span>
                </p>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {firebaseUser && !firebaseUser.emailVerified && (
              <GlassButton onClick={resendVerificationEmail}>
                <Mail className="h-4 w-4 text-white" aria-hidden="true" />
                <span>Resend Verification Email</span>
              </GlassButton>
            )}
            <GlassButton onClick={logout}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>Sign Out</span>
            </GlassButton>
          </div>
        </GlassCard>

        <GlassCard index={1} className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-white">Workspace Data</h2>
          <p className="text-xs leading-relaxed text-neutral-300">
            Export your saved library items, campaigns, brand voice configuration, and calendar
            entries as JSON.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <GlassButton onClick={handleExport}>
              <Download className="h-4 w-4 text-white" aria-hidden="true" />
              <span>Export Workspace JSON</span>
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
