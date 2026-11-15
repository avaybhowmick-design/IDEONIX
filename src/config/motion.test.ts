import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDropdownVariants,
  getModalDialogVariants,
  getPageVariants,
  getScaledDuration,
  getTabIndicatorTransition,
  MOTION_DURATIONS,
  MOTION_STAGGER,
} from './motion';

test('motion durations stay within 0.15s to 0.4s budget', () => {
  for (const val of Object.values(MOTION_DURATIONS)) {
    assert.ok(val >= 0.15 && val <= 0.4, `Expected ${val} to be within 0.15..0.4`);
  }
  assert.equal(MOTION_STAGGER.cards, 0.05);
  assert.equal(MOTION_STAGGER.list, 0.04);
});

test('reduced motion shortens durations without disabling them', () => {
  assert.equal(getScaledDuration(0.25, false), 0.25);
  const reduced = getScaledDuration(0.25, true);
  assert.ok(reduced > 0 && reduced < 0.25);

  const reducedTab = getTabIndicatorTransition(true);
  assert.ok('duration' in reducedTab && typeof reducedTab.duration === 'number' && reducedTab.duration > 0);
});

test('reusable variants expose required transform and opacity states', () => {
  const page = getPageVariants(0.25) as Record<string, { opacity?: number; y?: number }>;
  assert.equal(page.initial.opacity, 0);
  assert.equal(page.initial.y, 12);
  assert.equal(page.animate.opacity, 1);
  assert.equal(page.animate.y, 0);

  const dropdown = getDropdownVariants(0.18) as Record<string, { opacity?: number; y?: number; scale?: number }>;
  assert.equal(dropdown.initial.y, -8);
  assert.equal(dropdown.initial.scale, 0.98);
  assert.equal(dropdown.exit.y, -8);

  const modal = getModalDialogVariants(0.25) as Record<string, { scale?: number }>;
  assert.equal(modal.initial.scale, 0.95);
  assert.equal(modal.animate.scale, 1);
  assert.equal(modal.exit.scale, 0.95);
});
