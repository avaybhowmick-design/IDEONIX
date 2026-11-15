import React, { useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { ArrowLeft, Mail } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { BrandWordmark, CopyTextButton, GlassButton, GlassCard, inputClassName, labelClassName, PrimaryButton } from '../components/ui/GlassPrimitives';
import { LegalModal } from '../components/ui/LegalModal';
import { MOTION_EASING, useMotionSettings } from '../config/motion';

type AuthStep = 'choose' | 'email-login' | 'email-register' | 'forgot-password';

function GoogleGLogo() {
  return (
    <svg className="h-4 w-4 shrink-0 text-white" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="currentColor"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
      />
      <path
        fill="currentColor"
        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
      />
      <path
        fill="currentColor"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
      />
    </svg>
  );
}

export function LoginPage() {
  const {
    setView,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    resetPassword,
  } = useWorkspace();

  const [step, setStep] = useState<AuthStep>('choose');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);
  const { durations, tabTransition } = useMotionSettings();

  const handleGoogle = async () => {
    if (submitting) return;
    setErrorMsg(null);
    setInfoMsg(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg(null);
    setInfoMsg(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (step === 'forgot-password') {
      setSubmitting(true);
      try {
        await resetPassword(email);
        setInfoMsg('Password reset link sent. Check your inbox and spam folder.');
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Could not send reset email.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (step === 'email-register') {
        await registerWithEmail(name, email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col justify-between overflow-hidden">
      {/* Top minimal return link */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: durations.fast, ease: MOTION_EASING.out }}
          onClick={() => setView('landing')}
          className="glass inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 text-sm text-neutral-300 transition-[color,border-color,background-color,filter] duration-200 hover:border-white/30 hover:text-white hover:brightness-110"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to IDEONIX</span>
        </motion.button>
        <BrandWordmark />
      </header>

      {/* Centered Glass Auth Card */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        <GlassCard className="w-full max-w-[440px] p-7 sm:p-9">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span className="font-display font-semibold tracking-[0.2em] text-white">
                IDEONIX
              </span>
              <span aria-hidden="true">·</span>
              <span>From Ideas to Impact.</span>
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
              Welcome to Ideonix
            </h1>
            <p className="mt-1.5 text-sm text-neutral-300">
              Your creative intelligence starts here.
            </p>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="glass mb-4 rounded-xl !border-white/35 !bg-white/10 px-4 py-3 text-xs leading-relaxed text-white"
            >
              {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div
              role="status"
              className="glass mb-4 rounded-xl !border-white/30 !bg-white/10 px-4 py-3 text-xs leading-relaxed text-neutral-100"
            >
              {infoMsg}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 'choose' ? (
              <motion.div
                key="choose"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <GlassButton
                  onClick={handleGoogle}
                  loading={submitting}
                  className="w-full justify-center font-semibold"
                >
                  {!submitting && <GoogleGLogo />}
                  <span>Continue with Google</span>
                </GlassButton>

                <div className="relative flex items-center py-1">
                  <div className="flex-grow border-t border-white/15" />
                  <span className="mx-3 text-xs font-medium tracking-wider text-neutral-400">
                    OR
                  </span>
                  <div className="flex-grow border-t border-white/15" />
                </div>

                <GlassButton
                  onClick={() => {
                    setErrorMsg(null);
                    setInfoMsg(null);
                    setStep('email-login');
                  }}
                  disabled={submitting}
                  className="w-full justify-center"
                >
                  <Mail className="h-4 w-4 text-white" aria-hidden="true" />
                  <span>Continue with Email</span>
                </GlassButton>
              </motion.div>
            ) : (
              <motion.form
                key={step}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                onSubmit={handleEmailSubmit}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <motion.button
                    type="button"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: durations.fast, ease: MOTION_EASING.out }}
                    onClick={() => {
                      setErrorMsg(null);
                      setInfoMsg(null);
                      setStep('choose');
                    }}
                    className="glass inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-neutral-300 transition-colors hover:border-white/30 hover:text-white"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Back</span>
                  </motion.button>

                  {step !== 'forgot-password' && (
                    <LayoutGroup id="login-auth-tabs">
                      <div className="glass flex items-center gap-1 rounded-lg p-0.5 text-xs">
                        {(['email-login', 'email-register'] as const).map((tabId) => {
                          const active = step === tabId;
                          return (
                            <motion.button
                              key={tabId}
                              type="button"
                              whileTap={{ scale: 0.97 }}
                              onClick={() => {
                                setErrorMsg(null);
                                setStep(tabId);
                              }}
                              className={`relative rounded-md px-2.5 py-1 transition-colors ${
                                active ? 'text-white font-semibold' : 'text-neutral-300 hover:text-white'
                              }`}
                            >
                              {active && (
                                <motion.span
                                  layoutId="login-auth-tab-pill"
                                  transition={{ layout: tabTransition }}
                                  className="pointer-events-none absolute inset-0 rounded-md bg-white/20"
                                  aria-hidden="true"
                                />
                              )}
                              <span className="relative z-10">
                                {tabId === 'email-login' ? 'Sign in' : 'Register'}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </LayoutGroup>
                  )}
                </div>

                {step === 'email-register' && (
                  <div>
                    <label htmlFor="auth-name" className={labelClassName}>
                      Creator Name
                    </label>
                    <input
                      id="auth-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Rivera"
                      className={inputClassName}
                      disabled={submitting}
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="auth-email" className={labelClassName}>
                    Email Address
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@studio.com"
                    className={inputClassName}
                    disabled={submitting}
                  />
                </div>

                {step !== 'forgot-password' && (
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="auth-password" className="text-xs font-medium text-neutral-300">
                        Password
                      </label>
                      {step === 'email-login' && (
                        <button
                          type="button"
                          onClick={() => {
                            setErrorMsg(null);
                            setInfoMsg(null);
                            setStep('forgot-password');
                          }}
                          className="text-xs text-neutral-300 underline decoration-white/30 underline-offset-2 hover:text-white"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <input
                      id="auth-password"
                      type="password"
                      required
                      autoComplete={step === 'email-register' ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className={inputClassName}
                      disabled={submitting}
                    />
                  </div>
                )}

                <PrimaryButton type="submit" loading={submitting} className="w-full justify-center">
                  <span>
                    {step === 'email-register'
                      ? 'Create Account'
                      : step === 'forgot-password'
                      ? 'Send Reset Link'
                      : 'Sign In'}
                  </span>
                </PrimaryButton>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-6 border-t border-white/15 pt-5">
            <p className="text-center text-xs leading-relaxed text-neutral-400">
              By continuing, you agree to our{' '}
              <button
                type="button"
                onClick={() => setLegalModal('terms')}
                className="underline decoration-white/30 underline-offset-2 hover:text-white"
              >
                Terms of Service
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={() => setLegalModal('privacy')}
                className="underline decoration-white/30 underline-offset-2 hover:text-white"
              >
                Privacy Policy
              </button>
              .
            </p>

            {typeof window !== 'undefined' && (
              <div className="glass mt-4 flex items-center justify-between gap-2 rounded-xl px-3 py-2">
                <span className="truncate font-mono text-[11px] text-neutral-300 select-all">
                  {window.location.hostname}
                </span>
                <CopyTextButton text={window.location.hostname} label="Copy" />
              </div>
            )}
          </div>
        </GlassCard>
      </main>

      <footer className="relative z-10 px-6 py-4 text-center text-xs">
        <span className="inline-block rounded-lg border border-white/20 bg-black/75 px-3 py-1 text-white backdrop-blur-md">
          IDEONIX · Autonomous Creator Agents
        </span>
      </footer>

      <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
    </div>
  );
}
