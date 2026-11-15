import React, { createContext, useContext } from 'react';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { Bookmark, Check, Copy, Loader2 } from 'lucide-react';
import {
  getCardItemVariants,
  getCardStaggerVariants,
  MOTION_EASING,
  MOTION_STAGGER,
  useMotionSettings,
} from '../../config/motion';

const StaggerContext = createContext(false);

export function StaggerGroup({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { durations, d } = useMotionSettings();
  return (
    <StaggerContext.Provider value={true}>
      <motion.div
        variants={getCardStaggerVariants(durations.base, d(MOTION_STAGGER.cards))}
        initial="hidden"
        animate="visible"
        className={className}
      >
        {children}
      </motion.div>
    </StaggerContext.Provider>
  );
}

export function BrandWordmark({
  className = '',
  shimmer = false,
}: {
  className?: string;
  shimmer?: boolean;
}) {
  const { prefersReduced } = useMotionSettings();
  const sweepDuration = prefersReduced ? 0.45 : 1.2;
  const repeatDelay = prefersReduced ? 5.55 : 4.8;

  return (
    <span
      className={`font-display inline-flex items-center gap-2 text-lg font-bold tracking-[0.22em] text-white whitespace-nowrap shrink-0 ${className}`}
    >
      <span className="inline-block h-2 w-2 rounded-sm bg-white" aria-hidden="true" />
      <span className="relative inline-block overflow-hidden">
        <span className={shimmer ? 'text-white/85' : ''}>IDEONIX</span>
        {shimmer && (
          <motion.span
            aria-hidden="true"
            initial={{ x: '-48px', opacity: 0 }}
            animate={{ x: ['-48px', '140px'], opacity: [0, 0.9, 0] }}
            transition={{
              duration: sweepDuration,
              delay: 0.5,
              repeat: Infinity,
              repeatDelay,
              ease: 'easeInOut',
            }}
            className="pointer-events-none absolute inset-y-0 left-0 w-10 -skew-x-12"
            style={{
              background:
                'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.36) 50%, rgba(255,255,255,0) 100%)',
            }}
          />
        )}
      </span>
    </span>
  );
}

export function GlassCard({
  children,
  className = '',
  hoverLift = true,
  index,
}: {
  children: React.ReactNode;
  className?: string;
  hoverLift?: boolean;
  index?: number;
  subtle?: boolean;
  withRefraction?: boolean;
}) {
  const inGroup = useContext(StaggerContext);
  const { durations, d } = useMotionSettings();
  const itemVariants: Variants = getCardItemVariants(durations.base);

  if (inGroup && index === undefined) {
    return (
      <motion.div
        variants={itemVariants}
        whileHover={hoverLift ? { y: -4 } : undefined}
        transition={{ duration: durations.fast, ease: MOTION_EASING.out }}
        className={`glass rounded-2xl transition-[border-color,background-color] duration-200 ${
          hoverLift ? 'hover:border-white/30' : ''
        } ${className}`}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hoverLift ? { y: -4 } : undefined}
      transition={{
        opacity: {
          duration: durations.base,
          delay: index !== undefined ? d(index * MOTION_STAGGER.cards) : 0,
          ease: MOTION_EASING.out,
        },
        y: {
          duration: durations.fast,
          delay: 0,
          ease: MOTION_EASING.out,
        },
      }}
      className={`glass rounded-2xl transition-[border-color,background-color] duration-200 ${
        hoverLift ? 'hover:border-white/30' : ''
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}

type SafeButtonAttrs = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onAnimationStart' | 'onDrag' | 'onDragEnd' | 'onDragStart'
>;

export function PrimaryButton({
  children,
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}: SafeButtonAttrs & { loading?: boolean }) {
  const { durations } = useMotionSettings();
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      disabled={isDisabled}
      whileHover={isDisabled ? undefined : { y: -2 }}
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      transition={{ duration: durations.fast, ease: MOTION_EASING.out }}
      className={`glass-subtle inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl !border-white/35 !bg-white/15 px-5 py-2.5 text-sm font-semibold text-white transition-[background-color,border-color,filter] duration-200 hover:!bg-white/25 hover:!border-white/50 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] disabled:cursor-not-allowed disabled:opacity-55 whitespace-nowrap shrink-0 ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </motion.button>
  );
}

export function GlassButton({
  children,
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}: SafeButtonAttrs & { loading?: boolean }) {
  const { durations } = useMotionSettings();
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      disabled={isDisabled}
      whileHover={isDisabled ? undefined : { y: -2 }}
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      transition={{ duration: durations.fast, ease: MOTION_EASING.out }}
      className={`glass-subtle inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium text-neutral-100 transition-[background-color,border-color,filter] duration-200 hover:border-white/35 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:cursor-not-allowed disabled:opacity-55 whitespace-nowrap shrink-0 ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </motion.button>
  );
}

export function CopyTextButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = React.useState(false);
  const { durations } = useMotionSettings();
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleCopy}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: durations.fast, ease: MOTION_EASING.out }}
      aria-label={copied ? 'Copied to clipboard' : label}
      className="glass inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-300 transition-[color,border-color,background-color,filter] duration-200 hover:border-white/30 hover:text-white hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 whitespace-nowrap shrink-0"
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            initial={{ opacity: 0, scale: 0.55 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.55 }}
            transition={{ duration: durations.micro, ease: MOTION_EASING.out }}
            className="inline-flex items-center"
          >
            <Check className="h-3.5 w-3.5 text-white" aria-hidden="true" />
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ opacity: 0, scale: 0.55 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.55 }}
            transition={{ duration: durations.micro, ease: MOTION_EASING.out }}
            className="inline-flex items-center"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          </motion.span>
        )}
      </AnimatePresence>
      <span>{copied ? 'Copied' : label}</span>
    </motion.button>
  );
}

export function SaveActionButton({
  onSave,
  label = 'Save',
  savedLabel = 'Saved',
  variant = 'glass',
  disabled = false,
  className = '',
}: {
  onSave: () => Promise<unknown> | unknown;
  label?: string;
  savedLabel?: string;
  variant?: 'glass' | 'primary' | 'compact';
  disabled?: boolean;
  className?: string;
}) {
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const { durations } = useMotionSettings();
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = async () => {
    if (saving || disabled) return;
    setSaving(true);
    try {
      await onSave();
      setSaved(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setSaved(false), 1500);
    } catch {
      // handled upstream
    } finally {
      setSaving(false);
    }
  };

  const baseStyles =
    variant === 'primary'
      ? 'glass inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl !border-white/35 !bg-white/15 px-4 py-2 text-xs font-semibold text-white hover:!bg-white/25 hover:!border-white/50'
      : variant === 'compact'
      ? 'glass inline-flex min-h-[32px] items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium text-neutral-300 hover:border-white/30 hover:text-white'
      : 'glass inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-medium text-neutral-100 hover:border-white/35 hover:text-white';

  return (
    <motion.button
      type="button"
      disabled={disabled || saving}
      onClick={handleClick}
      whileHover={disabled || saving ? undefined : { y: -2 }}
      whileTap={disabled || saving ? undefined : { scale: 0.97 }}
      transition={{ duration: durations.fast, ease: MOTION_EASING.out }}
      className={`${baseStyles} transition-[background-color,border-color,color,filter] duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:cursor-not-allowed disabled:opacity-55 whitespace-nowrap shrink-0 ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {saving ? (
          <motion.span
            key="spin"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: durations.micro }}
            className="inline-flex items-center"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin text-white" aria-hidden="true" />
          </motion.span>
        ) : saved ? (
          <motion.span
            key="check"
            initial={{ opacity: 0, scale: 0.55 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.55 }}
            transition={{ duration: durations.micro, ease: MOTION_EASING.out }}
            className="inline-flex items-center"
          >
            <Check className="h-3.5 w-3.5 text-white" aria-hidden="true" />
          </motion.span>
        ) : (
          <motion.span
            key="bookmark"
            initial={{ opacity: 0, scale: 0.55 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.55 }}
            transition={{ duration: durations.micro, ease: MOTION_EASING.out }}
            className="inline-flex items-center"
          >
            <Bookmark className="h-3.5 w-3.5 text-white" aria-hidden="true" />
          </motion.span>
        )}
      </AnimatePresence>
      <span>{saved ? savedLabel : label}</span>
    </motion.button>
  );
}

function ShimmerBar({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-white/[0.07] ${className}`}>
      <motion.div
        aria-hidden="true"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{
          duration: 1.15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0) 100%)',
        }}
      />
    </div>
  );
}

export function ResultsSkeleton({
  variant = 'cards',
  count = 4,
}: {
  variant?: 'cards' | 'script' | 'viral' | 'doctor' | 'single' | 'inline';
  count?: number;
}) {
  const { durations } = useMotionSettings();

  if (variant === 'inline') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: durations.fast }}
        className="space-y-3"
        aria-label="Generating result"
      >
        <ShimmerBar className="h-3 w-28" />
        <ShimmerBar className="h-5 w-3/4" />
        <ShimmerBar className="h-3.5 w-full" />
        <ShimmerBar className="h-3.5 w-5/6" />
      </motion.div>
    );
  }

  if (variant === 'doctor') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: durations.fast }}
        className="grid gap-5 lg:grid-cols-2"
        aria-label="Diagnosing draft"
      >
        {[0, 1].map((col) => (
          <div key={col} className="glass rounded-2xl p-6 space-y-3">
            <ShimmerBar className="h-3 w-28" />
            <ShimmerBar className="h-4 w-full" />
            <ShimmerBar className="h-4 w-11/12" />
            <ShimmerBar className="h-4 w-4/5" />
            <ShimmerBar className="h-4 w-2/3" />
          </div>
        ))}
      </motion.div>
    );
  }

  if (variant === 'viral') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: durations.fast }}
        className="glass rounded-2xl p-6 space-y-5"
        aria-label="Analyzing content"
      >
        <div className="flex items-center gap-6 border-b border-white/10 pb-5">
          <ShimmerBar className="h-24 w-24 shrink-0 !rounded-full" />
          <div className="flex-1 space-y-2.5">
            <ShimmerBar className="h-3.5 w-40" />
            <ShimmerBar className="h-4 w-3/4" />
            <ShimmerBar className="h-3 w-1/2" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className="glass rounded-xl p-4 space-y-2.5">
              <div className="flex justify-between">
                <ShimmerBar className="h-3.5 w-24" />
                <ShimmerBar className="h-3.5 w-12" />
              </div>
              <ShimmerBar className="h-1.5 w-full" />
              <ShimmerBar className="h-3 w-5/6" />
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (variant === 'script' || variant === 'single') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: durations.fast }}
        className="glass rounded-2xl p-6 space-y-4"
        aria-label="Generating output"
      >
        <ShimmerBar className="h-3.5 w-32" />
        <ShimmerBar className="h-6 w-2/3" />
        <ShimmerBar className="h-4 w-full" />
        <ShimmerBar className="h-4 w-11/12" />
        <ShimmerBar className="h-20 w-full" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: durations.fast }}
      className="grid gap-4 md:grid-cols-2"
      aria-label="Loading items"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="glass rounded-2xl p-6 space-y-3">
          <ShimmerBar className="h-3 w-28" />
          <ShimmerBar className="h-5 w-3/4" />
          <ShimmerBar className="h-3.5 w-full" />
          <ShimmerBar className="h-3.5 w-5/6" />
        </div>
      ))}
    </motion.div>
  );
}

export const inputClassName =
  'glass-subtle w-full min-h-[44px] rounded-2xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-400 transition-[border-color,box-shadow,background-color] duration-200 focus:!border-white focus:outline-none focus:ring-2 focus:ring-white/30';

export const labelClassName = 'block text-xs font-medium text-neutral-300 mb-1.5';

export { GlassSelect, type GlassSelectOption } from './GlassSelect';
