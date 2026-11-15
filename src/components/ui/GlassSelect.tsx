import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown } from 'lucide-react';
import { getDropdownVariants, MOTION_EASING, useMotionSettings } from '../../config/motion';

export interface GlassSelectOption {
  value: string;
  label: string;
}

interface GlassSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<string | GlassSelectOption>;
  disabled?: boolean;
  ariaLabel?: string;
  placeholder?: string;
  size?: 'default' | 'compact';
  className?: string;
}

export function GlassSelect({
  id,
  value,
  onChange,
  options,
  disabled = false,
  ariaLabel,
  placeholder = 'Select...',
  size = 'default',
  className = '',
}: GlassSelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();
  const { durations } = useMotionSettings();

  const normalizedOptions: GlassSelectOption[] = useMemo(
    () =>
      options.map((opt) =>
        typeof opt === 'string' ? { value: opt, label: opt } : opt
      ),
    [options]
  );

  const selectedOption = normalizedOptions.find((o) => o.value === value);

  const updatePosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const minMenuWidth = size === 'compact' ? Math.max(rect.width, 132) : rect.width;
    const maxLeft = Math.max(8, window.innerWidth - minMenuWidth - 8);
    const left = Math.min(Math.max(8, rect.left), maxLeft);

    if (spaceBelow < 200 && spaceAbove > spaceBelow) {
      setCoords({
        bottom: window.innerHeight - rect.top + 6,
        left,
        width: minMenuWidth,
        maxHeight: Math.min(256, Math.max(120, spaceAbove)),
      });
    } else {
      setCoords({
        top: rect.bottom + 6,
        left,
        width: minMenuWidth,
        maxHeight: Math.min(256, Math.max(120, spaceBelow)),
      });
    }
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const idx = normalizedOptions.findIndex((o) => o.value === value);
    setActiveIndex(idx >= 0 ? idx : 0);

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) =>
          normalizedOptions.length ? (prev + 1) % normalizedOptions.length : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) =>
          normalizedOptions.length
            ? (prev - 1 + normalizedOptions.length) % normalizedOptions.length
            : 0
        );
      } else if (e.key === 'Enter' && activeIndex >= 0 && normalizedOptions[activeIndex]) {
        e.preventDefault();
        onChange(normalizedOptions[activeIndex].value);
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleReposition = () => updatePosition();

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [open, value, normalizedOptions.length]);

  const triggerClasses =
    size === 'compact'
      ? 'glass inline-flex min-h-[28px] items-center justify-between gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium text-white transition-[border-color,box-shadow,background-color,filter] duration-200 hover:border-white/30 hover:brightness-110 focus:!border-white focus:outline-none focus:ring-2 focus:ring-white/30 disabled:cursor-not-allowed disabled:opacity-60'
      : 'glass flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-left text-sm text-white transition-[border-color,box-shadow,background-color,filter] duration-200 hover:border-white/30 hover:brightness-110 focus:!border-white focus:outline-none focus:ring-2 focus:ring-white/30 disabled:cursor-not-allowed disabled:opacity-55';

  const dropdownVariants = getDropdownVariants(durations.micro);

  return (
    <>
      <motion.button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        whileHover={disabled ? undefined : { y: -2 }}
        whileTap={disabled ? undefined : { scale: 0.97 }}
        transition={{ duration: durations.fast, ease: MOTION_EASING.out }}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev);
        }}
        onKeyDown={(e) => {
          if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={`${triggerClasses} ${className}`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <motion.span
          initial={false}
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: durations.micro, ease: MOTION_EASING.out }}
          className="inline-flex shrink-0 items-center justify-center"
        >
          <ChevronDown
            className={`${open ? 'text-white' : 'text-neutral-300'} ${
              size === 'compact' ? 'h-3 w-3' : 'h-4 w-4'
            }`}
            aria-hidden="true"
          />
        </motion.span>
      </motion.button>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && coords && (
              <motion.div
                ref={menuRef}
                id={listboxId}
                role="listbox"
                aria-label={ariaLabel}
                variants={dropdownVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{
                  position: 'fixed',
                  top: coords.top,
                  bottom: coords.bottom,
                  left: coords.left,
                  width: coords.width,
                  maxHeight: coords.maxHeight,
                  zIndex: 9999,
                  transformOrigin: coords.bottom !== undefined ? 'bottom' : 'top',
                }}
                className="glass overflow-y-auto rounded-xl !bg-[rgba(10,10,10,0.85)] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_16px_48px_rgba(0,0,0,0.85)] hover:!bg-[rgba(10,10,10,0.85)]"
              >
                {normalizedOptions.map((opt, idx) => {
                  const isSelected = opt.value === value;
                  const isHighlighted = idx === activeIndex;
                  return (
                    <motion.button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      whileTap={{ scale: 0.97 }}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => {
                        onChange(opt.value);
                        setOpen(false);
                        triggerRef.current?.focus();
                      }}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg text-left transition-colors ${
                        size === 'compact' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'
                      } ${
                        isSelected
                          ? 'bg-white/15 font-medium text-white'
                          : isHighlighted
                          ? 'bg-white/10 text-white'
                          : 'text-neutral-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-white" aria-hidden="true" />
                      )}
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
