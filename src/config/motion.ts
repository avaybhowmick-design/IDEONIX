import { useReducedMotion, type Transition, type Variants } from 'motion/react';

export const MOTION_DURATIONS = {
  micro: 0.18,
  fast: 0.2,
  base: 0.25,
  slow: 0.36,
} as const;

export const MOTION_EASING = {
  out: [0.22, 1, 0.36, 1] as const,
  inOut: [0.4, 0, 0.2, 1] as const,
};

export const MOTION_STAGGER = {
  cards: 0.05,
  list: 0.04,
} as const;

export function getScaledDuration(
  seconds: number,
  prefersReduced: boolean | null
): number {
  if (!prefersReduced) return seconds;
  return Math.max(0.08, Number((seconds * 0.4).toFixed(3)));
}

export function getTabIndicatorTransition(prefersReduced: boolean | null): Transition {
  if (prefersReduced) {
    return { duration: 0.15, ease: MOTION_EASING.inOut };
  }
  return {
    type: 'spring',
    stiffness: 420,
    damping: 34,
    mass: 0.8,
  };
}

export function getPageVariants(duration: number = MOTION_DURATIONS.base): Variants {
  return {
    initial: { opacity: 0, y: 12 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration, ease: MOTION_EASING.out },
    },
    exit: {
      opacity: 0,
      y: -12,
      transition: { duration: Math.max(0.15, Number((duration * 0.8).toFixed(3))), ease: MOTION_EASING.inOut },
    },
  };
}

export function getDropdownVariants(duration: number = MOTION_DURATIONS.micro): Variants {
  return {
    initial: { opacity: 0, y: -8, scale: 0.98 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration, ease: MOTION_EASING.out },
    },
    exit: {
      opacity: 0,
      y: -8,
      scale: 0.98,
      transition: { duration: Math.max(0.12, Number((duration * 0.85).toFixed(3))), ease: MOTION_EASING.inOut },
    },
  };
}

export function getModalBackdropVariants(duration: number = MOTION_DURATIONS.base): Variants {
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration, ease: MOTION_EASING.out } },
    exit: { opacity: 0, transition: { duration: Math.max(0.15, duration * 0.8), ease: MOTION_EASING.inOut } },
  };
}

export function getModalDialogVariants(duration: number = MOTION_DURATIONS.base): Variants {
  return {
    initial: { opacity: 0, scale: 0.95, y: 8 },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration, ease: MOTION_EASING.out },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 8,
      transition: { duration: Math.max(0.15, duration * 0.8), ease: MOTION_EASING.inOut },
    },
  };
}

export function getToastVariants(duration: number = MOTION_DURATIONS.base): Variants {
  return {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration, ease: MOTION_EASING.out },
    },
    exit: {
      opacity: 0,
      y: 20,
      scale: 0.98,
      transition: { duration: Math.max(0.15, duration * 0.8), ease: MOTION_EASING.inOut },
    },
  };
}

export function getCardStaggerVariants(
  duration: number = MOTION_DURATIONS.base,
  stagger: number = MOTION_STAGGER.cards
): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren: 0.02,
      },
    },
    exit: {
      transition: {
        duration,
      },
    },
  };
}

export function getCardItemVariants(duration: number = MOTION_DURATIONS.base): Variants {
  return {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration, ease: MOTION_EASING.out },
    },
  };
}

export function getListItemVariants(duration: number = MOTION_DURATIONS.base): Variants {
  return {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration, ease: MOTION_EASING.out },
    },
    exit: {
      opacity: 0,
      scale: 0.96,
      y: -6,
      transition: { duration: Math.max(0.15, duration * 0.8), ease: MOTION_EASING.inOut },
    },
  };
}

export function useMotionSettings() {
  const prefersReduced = useReducedMotion();
  const d = (seconds: number) => getScaledDuration(seconds, prefersReduced);

  return {
    prefersReduced: Boolean(prefersReduced),
    d,
    durations: {
      micro: d(MOTION_DURATIONS.micro),
      fast: d(MOTION_DURATIONS.fast),
      base: d(MOTION_DURATIONS.base),
      slow: d(MOTION_DURATIONS.slow),
    },
    tabTransition: getTabIndicatorTransition(prefersReduced),
  };
}
