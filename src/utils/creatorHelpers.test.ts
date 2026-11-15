import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWeeklyActivitySeries,
  filterLibraryItems,
  getMonthGridDays,
  getUpcomingReminders,
  getWeekDates,
  makeSafeId,
  mapFirebaseAuthError,
} from './creatorHelpers';
import { TokenBucketRateLimiter } from '../../server/rateLimit';
import { boundedInt, requireNonEmptyString, ValidationError } from '../../server/validation';
import type { CalendarEntry, LibraryItem } from '../types/ideonix';

test('makeSafeId produces Firestore-safe identifier', () => {
  const id = makeSafeId('idea');
  assert.match(id, /^[a-zA-Z0-9_-]+$/);
  assert.ok(id.startsWith('idea_'));
});

test('buildWeeklyActivitySeries aggregates last 7 days accurately', () => {
  const ref = new Date('2026-11-14T12:00:00Z');
  const series = buildWeeklyActivitySeries(
    [
      { id: '1', userId: 'u', tool: 'ideas', title: 'A', dateKey: '2026-11-14', createdAt: '' },
      { id: '2', userId: 'u', tool: 'script', title: 'B', dateKey: '2026-11-14', createdAt: '' },
      { id: '3', userId: 'u', tool: 'caption', title: 'C', dateKey: '2026-11-10', createdAt: '' },
      { id: '4', userId: 'u', tool: 'old', title: 'Old', dateKey: '2026-10-01', createdAt: '' },
    ],
    ref
  );

  assert.equal(series.length, 7);
  assert.equal(series[6].dateKey, '2026-11-14');
  assert.equal(series[6].count, 2);
  assert.equal(series[2].dateKey, '2026-11-10');
  assert.equal(series[2].count, 1);
});

test('filterLibraryItems filters by category and search query', () => {
  const items: LibraryItem[] = [
    {
      id: '1',
      userId: 'u',
      category: 'script',
      title: 'Camera Setup Hook',
      summary: 'Crisp studio lighting breakdown',
      platform: 'Instagram Reels',
      tags: ['lighting', 'gear'],
      payload: {},
      createdAt: '',
      updatedAt: '',
    },
    {
      id: '2',
      userId: 'u',
      category: 'idea',
      title: 'Editing Speed Tips',
      summary: 'Cut retention dead air',
      platform: 'YouTube Shorts',
      tags: ['editing'],
      payload: {},
      createdAt: '',
      updatedAt: '',
    },
  ];

  assert.equal(filterLibraryItems(items, '', 'all').length, 2);
  assert.equal(filterLibraryItems(items, '', 'script').length, 1);
  assert.equal(filterLibraryItems(items, 'gear', 'all').length, 1);
  assert.equal(filterLibraryItems(items, 'editing', 'script').length, 0);
});

test('calendar date grids and upcoming reminders work deterministically', () => {
  const grid = getMonthGridDays(2026, 10); // November 2026
  assert.equal(grid.length, 42);
  assert.equal(grid.filter((c) => c.inMonth).length, 30);

  const week = getWeekDates('2026-11-14');
  assert.equal(week.length, 7);
  assert.equal(week[0], '2026-11-08');
  assert.equal(week[6], '2026-11-14');

  const entries: CalendarEntry[] = [
    {
      id: 'a',
      userId: 'u',
      title: 'Past Published',
      date: '2026-11-12',
      timeSlot: '09:00',
      platform: 'Instagram',
      status: 'Published',
      notes: '',
      reminderAt: '',
      linkedScriptId: '',
      linkedScriptTitle: '',
      linkedCaptionId: '',
      linkedCaptionTitle: '',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'b',
      userId: 'u',
      title: 'Later Planned',
      date: '2026-11-18',
      timeSlot: '18:00',
      platform: 'YouTube',
      status: 'Planned',
      notes: '',
      reminderAt: '2026-11-18T17:30',
      linkedScriptId: '',
      linkedScriptTitle: '',
      linkedCaptionId: '',
      linkedCaptionTitle: '',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'c',
      userId: 'u',
      title: 'Sooner Draft',
      date: '2026-11-15',
      timeSlot: '10:00',
      platform: 'Instagram',
      status: 'Draft',
      notes: '',
      reminderAt: '',
      linkedScriptId: '',
      linkedScriptTitle: '',
      linkedCaptionId: '',
      linkedCaptionTitle: '',
      createdAt: '',
      updatedAt: '',
    },
  ];

  const upcoming = getUpcomingReminders(entries, '2026-11-14');
  assert.deepEqual(
    upcoming.map((e) => e.id),
    ['c', 'b']
  );
});

test('TokenBucketRateLimiter enforces burst cap and refills over time', () => {
  const limiter = new TokenBucketRateLimiter(2, 10_000);
  assert.equal(limiter.consume('ip1', 0).allowed, true);
  assert.equal(limiter.consume('ip1', 100).allowed, true);
  const blocked = limiter.consume('ip1', 200);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds >= 1);
  // After full window, tokens refill
  assert.equal(limiter.consume('ip1', 10_500).allowed, true);
});

test('server validation helpers enforce non-empty strings and integer bounds', () => {
  assert.equal(requireNonEmptyString('  Creator Ops  ', 'Topic'), 'Creator Ops');
  assert.throws(() => requireNonEmptyString('   ', 'Topic'), ValidationError);
  assert.equal(boundedInt('99', 5, 1, 10), 10);
  assert.equal(boundedInt('bad', 5, 1, 10), 5);
});

test('mapFirebaseAuthError produces friendly error copy', () => {
  assert.match(mapFirebaseAuthError('Firebase: Error (auth/invalid-credential).'), /Incorrect email or password/);
  assert.match(mapFirebaseAuthError('auth/operation-not-allowed'), /not enabled yet/);
});
