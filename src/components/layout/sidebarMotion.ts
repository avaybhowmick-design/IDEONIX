export const SIDEBAR_EXPANDED_WIDTH = 256;
export const SIDEBAR_COLLAPSED_WIDTH = 76;

export const SIDEBAR_TIMING = {
  entranceDuration: 0.4,
  entranceX: -20,
  staggerDelay: 0.04,
  hoverDuration: 0.2,
  hoverShiftX: 4,
  hoverIconScale: 1.1,
  hoverBgAlpha: 0.06,
  tapScale: 0.97,
  collapseDuration: 0.3,
  collapseArrowRotate: 180,
  signOutArrowNudgeX: 3,
  logoShimmerDuration: 1.2,
  logoShimmerRepeatDelay: 4.8,
} as const;

export function scaleDuration(seconds: number, prefersReduced: boolean | null): number {
  if (!prefersReduced) return seconds;
  return Math.max(0.015, Number((seconds * 0.35).toFixed(3)));
}

export function getNavItemEntranceDelay(index: number, prefersReduced: boolean | null): number {
  const safeIndex = Math.max(0, index);
  return Number((safeIndex * scaleDuration(SIDEBAR_TIMING.staggerDelay, prefersReduced)).toFixed(4));
}

export function getSidebarPillTransition(prefersReduced: boolean | null) {
  if (prefersReduced) {
    return { duration: 0.14, ease: 'easeInOut' as const };
  }
  return {
    type: 'spring' as const,
    stiffness: 400,
    damping: 34,
    mass: 0.85,
  };
}
