import type { ActivityLog, CalendarEntry, LibraryCategory, LibraryItem } from '../types/ideonix';

export function makeSafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export function getLast7DayKeys(referenceDate: Date = new Date()): string[] {
  const keys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - i);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

export interface DailyActivityPoint {
  dateKey: string;
  label: string;
  count: number;
}

export function buildWeeklyActivitySeries(
  logs: ActivityLog[],
  referenceDate: Date = new Date()
): DailyActivityPoint[] {
  const keys = getLast7DayKeys(referenceDate);
  const counts = new Map<string, number>();
  for (const k of keys) counts.set(k, 0);

  for (const log of logs) {
    if (counts.has(log.dateKey)) {
      counts.set(log.dateKey, (counts.get(log.dateKey) ?? 0) + 1);
    }
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return keys.map((dateKey) => {
    const [y, m, d] = dateKey.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return {
      dateKey,
      label: dayNames[dt.getUTCDay()],
      count: counts.get(dateKey) ?? 0,
    };
  });
}

export function filterLibraryItems(
  items: LibraryItem[],
  search: string,
  category: LibraryCategory | 'all'
): LibraryItem[] {
  const q = search.trim().toLowerCase();
  return items.filter((item) => {
    if (category !== 'all' && item.category !== category) return false;
    if (!q) return true;
    const haystack = [
      item.title,
      item.summary,
      item.platform,
      item.category,
      ...(item.tags || []),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function getMonthGridDays(year: number, monthZeroIndexed: number): Array<{ dateStr: string; inMonth: boolean; dayNumber: number }> {
  const firstDay = new Date(Date.UTC(year, monthZeroIndexed, 1));
  const startWeekday = firstDay.getUTCDay(); // 0 = Sun
  const startCursor = new Date(Date.UTC(year, monthZeroIndexed, 1 - startWeekday));

  const cells: Array<{ dateStr: string; inMonth: boolean; dayNumber: number }> = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startCursor);
    d.setUTCDate(startCursor.getUTCDate() + i);
    cells.push({
      dateStr: d.toISOString().slice(0, 10),
      inMonth: d.getUTCMonth() === monthZeroIndexed,
      dayNumber: d.getUTCDate(),
    });
  }
  return cells;
}

export function getWeekDates(anchorDateStr: string): string[] {
  const [y, m, d] = anchorDateStr.split('-').map(Number);
  const anchor = new Date(Date.UTC(y, m - 1, d));
  const weekday = anchor.getUTCDay();
  const sunday = new Date(anchor);
  sunday.setUTCDate(anchor.getUTCDate() - weekday);

  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(sunday);
    cur.setUTCDate(sunday.getUTCDate() + i);
    days.push(cur.toISOString().slice(0, 10));
  }
  return days;
}

export function getUpcomingReminders(
  entries: CalendarEntry[],
  todayIso: string = new Date().toISOString().slice(0, 10)
): CalendarEntry[] {
  return entries
    .filter((entry) => entry.status !== 'Published' && entry.date >= todayIso)
    .sort((a, b) => (a.date + a.timeSlot).localeCompare(b.date + b.timeSlot));
}

export function mapFirebaseAuthError(codeOrMessage: string): string {
  const lower = codeOrMessage.toLowerCase();
  if (lower.includes('auth/invalid-credential') || lower.includes('auth/wrong-password')) {
    return 'Incorrect email or password. Please check your credentials and try again.';
  }
  if (lower.includes('auth/user-not-found')) {
    return 'No account found for this email address. Switch to Create Account to sign up.';
  }
  if (lower.includes('auth/email-already-in-use')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (lower.includes('auth/weak-password')) {
    return 'Password must be at least 6 characters long.';
  }
  if (lower.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (lower.includes('auth/popup-closed-by-user')) {
    return 'Google sign-in popup was closed before finishing.';
  }
  if (lower.includes('auth/popup-blocked')) {
    return 'Popup was blocked by your browser. Switching to redirect sign-in...';
  }
  if (lower.includes('auth/operation-not-allowed')) {
    return 'This sign-in provider is not enabled yet in Firebase Console Authentication > Sign-in method.';
  }
  if (lower.includes('auth/unauthorized-domain')) {
    return 'This domain is not authorized in Firebase Console > Authentication > Settings > Authorized domains.';
  }
  if (lower.includes('auth/too-many-requests')) {
    return 'Too many attempts. Please wait a few minutes and try again.';
  }
  return codeOrMessage || 'Authentication failed. Please try again.';
}
