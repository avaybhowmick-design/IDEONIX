import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getNavItemEntranceDelay,
  getSidebarPillTransition,
  scaleDuration,
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_EXPANDED_WIDTH,
  SIDEBAR_TIMING,
} from './sidebarMotion';

test('sidebar motion constants match specification', () => {
  assert.equal(SIDEBAR_EXPANDED_WIDTH, 256);
  assert.equal(SIDEBAR_COLLAPSED_WIDTH, 76);
  assert.equal(SIDEBAR_TIMING.entranceDuration, 0.4);
  assert.equal(SIDEBAR_TIMING.entranceX, -20);
  assert.equal(SIDEBAR_TIMING.staggerDelay, 0.04);
  assert.equal(SIDEBAR_TIMING.hoverDuration, 0.2);
  assert.equal(SIDEBAR_TIMING.hoverShiftX, 4);
  assert.equal(SIDEBAR_TIMING.hoverIconScale, 1.1);
  assert.equal(SIDEBAR_TIMING.tapScale, 0.97);
  assert.equal(SIDEBAR_TIMING.collapseDuration, 0.3);
  assert.equal(SIDEBAR_TIMING.collapseArrowRotate, 180);
  assert.equal(SIDEBAR_TIMING.signOutArrowNudgeX, 3);
  assert.equal(
    SIDEBAR_TIMING.logoShimmerDuration + SIDEBAR_TIMING.logoShimmerRepeatDelay,
    6
  );
});

test('prefers-reduced-motion shortens durations without disabling animations', () => {
  assert.equal(scaleDuration(0.4, false), 0.4);
  const reducedEntrance = scaleDuration(0.4, true);
  assert.ok(reducedEntrance > 0 && reducedEntrance < 0.4);

  const normalPill = getSidebarPillTransition(false);
  assert.equal(normalPill.type, 'spring');

  const reducedPill = getSidebarPillTransition(true);
  assert.ok(
    'duration' in reducedPill &&
      typeof reducedPill.duration === 'number' &&
      reducedPill.duration > 0 &&
      reducedPill.duration < 0.3
  );
});

test('nav item entrance stagger increments by 0.04s per item normally and shortens cleanly', () => {
  assert.equal(getNavItemEntranceDelay(0, false), 0);
  assert.equal(getNavItemEntranceDelay(1, false), 0.04);
  assert.equal(getNavItemEntranceDelay(5, false), 0.2);
  assert.ok(getNavItemEntranceDelay(5, true) > 0);
  assert.ok(getNavItemEntranceDelay(5, true) < getNavItemEntranceDelay(5, false));
});
