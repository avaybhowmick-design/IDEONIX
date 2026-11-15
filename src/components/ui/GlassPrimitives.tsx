import React from 'react';
import { Check, Copy, Loader2 } from 'lucide-react';

export function BrandWordmark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`font-display inline-flex items-center gap-2 text-lg font-bold tracking-[0.22em] text-white whitespace-nowrap shrink-0 ${className}`}
    >
      <span className="inline-block h-2 w-2 rounded-sm bg-violet-400" aria-hidden="true" />
      <span>IDEONIX</span>
    </span>
  );
}

export function GlassCard({
  children,
  className = '',
  subtle = false,
  withRefraction = false,
}: {
  children: React.ReactNode;
  className?: string;
  subtle?: boolean;
  withRefraction?: boolean;
}) {
  return (
    <div className={`${subtle ? 'liquid-glass-subtle' : 'liquid-glass'} rounded-2xl ${className}`}>
      {withRefraction && <div className="liquid-refraction-rim" aria-hidden="true" />}
      {children}
    </div>
  );
}

export function PrimaryButton({
  children,
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07070b] disabled:cursor-not-allowed disabled:opacity-55 whitespace-nowrap shrink-0 ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function GlassButton({
  children,
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-[#f4f4f8] backdrop-blur-md transition-colors hover:bg-white/[0.12] hover:border-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-55 whitespace-nowrap shrink-0 ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function CopyTextButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Copied to clipboard' : label}
      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-[#b8bcd0] transition-colors hover:bg-white/[0.1] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 whitespace-nowrap shrink-0"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-violet-300" aria-hidden="true" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

export const inputClassName =
  'w-full min-h-[44px] rounded-xl border border-white/12 bg-[#0c0d16]/80 px-3.5 py-2.5 text-sm text-[#f4f4f8] placeholder-[#7e8399] transition-colors focus:border-violet-400/70 focus:outline-none focus:ring-2 focus:ring-violet-500/25';

export const labelClassName = 'block text-xs font-medium text-[#b8bcd0] mb-1.5';
