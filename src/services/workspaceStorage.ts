import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../config/firebase';
import type {
  ActivityLog,
  BrandVoiceConfig,
  CalendarEntry,
  CampaignPlan,
  CreatorProfileAnalysis,
  LibraryItem,
} from '../types/ideonix';
import {
  buildSampleActivity,
  buildSampleCalendar,
  buildSampleCampaigns,
  buildSampleLibrary,
  DEFAULT_BRAND_VOICE,
} from './sampleData';
import { makeSafeId } from '../utils/creatorHelpers';

const DEMO_STORAGE_KEY = 'ideonix_demo_workspace_v1';

export interface WorkspaceSnapshot {
  brandVoice: BrandVoiceConfig;
  creatorProfile: CreatorProfileAnalysis | null;
  library: LibraryItem[];
  campaigns: CampaignPlan[];
  calendar: CalendarEntry[];
  activityLogs: ActivityLog[];
}

function readLocalDemo(): WorkspaceSnapshot {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as WorkspaceSnapshot;
    }
  } catch {
    // ignore corrupted local storage
  }
  const seeded: WorkspaceSnapshot = {
    brandVoice: DEFAULT_BRAND_VOICE,
    creatorProfile: null,
    library: buildSampleLibrary('demo-user'),
    campaigns: buildSampleCampaigns('demo-user'),
    calendar: buildSampleCalendar('demo-user'),
    activityLogs: buildSampleActivity('demo-user'),
  };
  writeLocalDemo(seeded);
  return seeded;
}

function writeLocalDemo(snapshot: WorkspaceSnapshot) {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore storage quota errors
  }
}

export function resetLocalDemoWorkspace(): WorkspaceSnapshot {
  try {
    localStorage.removeItem(DEMO_STORAGE_KEY);
  } catch {
    // ignore
  }
  return readLocalDemo();
}

function timestampToIso(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val !== null && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

export async function loadWorkspaceData(options: {
  mode: 'firebase' | 'demo';
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
}): Promise<WorkspaceSnapshot> {
  if (options.mode === 'demo') {
    return readLocalDemo();
  }

  const { uid, email, displayName, emailVerified } = options;

  let brandVoice = DEFAULT_BRAND_VOICE;
  let creatorProfile: CreatorProfileAnalysis | null = null;

  const userPath = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.brandVoice) brandVoice = data.brandVoice as BrandVoiceConfig;
      if (data.creatorProfile) creatorProfile = data.creatorProfile as CreatorProfileAnalysis;
    } else if (emailVerified) {
      await setDoc(userRef, {
        uid,
        email: email || 'creator@ideonix.app',
        displayName: displayName || 'Creator',
        brandVoice: DEFAULT_BRAND_VOICE,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, userPath);
  }

  let library: LibraryItem[] = [];
  try {
    const q = query(collection(db, 'libraryItems'), where('userId', '==', uid));
    const snaps = await getDocs(q);
    library = snaps.docs
      .map((d) => {
        const raw = d.data();
        return {
          ...(raw as Omit<LibraryItem, 'createdAt' | 'updatedAt'>),
          id: d.id,
          createdAt: timestampToIso(raw.createdAt),
          updatedAt: timestampToIso(raw.updatedAt),
        };
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'libraryItems');
  }

  let campaigns: CampaignPlan[] = [];
  try {
    const q = query(collection(db, 'campaigns'), where('userId', '==', uid));
    const snaps = await getDocs(q);
    campaigns = snaps.docs
      .map((d) => {
        const raw = d.data();
        return {
          ...(raw as Omit<CampaignPlan, 'createdAt' | 'updatedAt'>),
          id: d.id,
          createdAt: timestampToIso(raw.createdAt),
          updatedAt: timestampToIso(raw.updatedAt),
        };
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'campaigns');
  }

  let calendar: CalendarEntry[] = [];
  try {
    const q = query(collection(db, 'calendarEntries'), where('userId', '==', uid));
    const snaps = await getDocs(q);
    calendar = snaps.docs
      .map((d) => {
        const raw = d.data();
        return {
          ...(raw as Omit<CalendarEntry, 'createdAt' | 'updatedAt'>),
          id: d.id,
          createdAt: timestampToIso(raw.createdAt),
          updatedAt: timestampToIso(raw.updatedAt),
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'calendarEntries');
  }

  let activityLogs: ActivityLog[] = [];
  try {
    const q = query(collection(db, 'activityLogs'), where('userId', '==', uid));
    const snaps = await getDocs(q);
    activityLogs = snaps.docs.map((d) => {
      const raw = d.data();
      return {
        ...(raw as Omit<ActivityLog, 'createdAt'>),
        id: d.id,
        createdAt: timestampToIso(raw.createdAt),
      };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'activityLogs');
  }

  return { brandVoice, creatorProfile, library, campaigns, calendar, activityLogs };
}

export async function saveBrandVoiceStorage(
  mode: 'firebase' | 'demo',
  uid: string,
  brandVoice: BrandVoiceConfig
) {
  if (mode === 'demo') {
    const snap = readLocalDemo();
    snap.brandVoice = { ...brandVoice, updatedAt: new Date().toISOString() };
    writeLocalDemo(snap);
    return;
  }
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      brandVoice: {
        preset: brandVoice.preset,
        customDescription: brandVoice.customDescription.slice(0, 1200),
        targetAudience: brandVoice.targetAudience.slice(0, 300),
        bannedWords: brandVoice.bannedWords.slice(0, 400),
      },
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function saveCreatorProfileStorage(
  mode: 'firebase' | 'demo',
  uid: string,
  profile: CreatorProfileAnalysis
) {
  if (mode === 'demo') {
    const snap = readLocalDemo();
    snap.creatorProfile = profile;
    writeLocalDemo(snap);
    return;
  }
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      creatorProfile: profile,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function saveLibraryItemStorage(
  mode: 'firebase' | 'demo',
  uid: string,
  item: Omit<LibraryItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<LibraryItem> {
  const id = item.id && /^[a-zA-Z0-9_-]+$/.test(item.id) ? item.id : makeSafeId('lib');
  const now = new Date().toISOString();
  const normalizedTags = (item.tags || []).slice(0, 10).map((t) => String(t).slice(0, 40));

  const record: LibraryItem = {
    id,
    userId: uid,
    category: item.category,
    title: item.title.trim().slice(0, 200) || 'Untitled Item',
    summary: (item.summary || '').trim().slice(0, 1000),
    platform: (item.platform || 'Multi-platform').trim().slice(0, 60),
    tags: normalizedTags,
    payload: item.payload || {},
    createdAt: now,
    updatedAt: now,
  };

  if (mode === 'demo') {
    const snap = readLocalDemo();
    const existingIdx = snap.library.findIndex((x) => x.id === id);
    if (existingIdx >= 0) {
      record.createdAt = snap.library[existingIdx].createdAt;
      snap.library[existingIdx] = record;
    } else {
      snap.library.unshift(record);
    }
    writeLocalDemo(snap);
    return record;
  }

  const path = `libraryItems/${id}`;
  try {
    const ref = doc(db, 'libraryItems', id);
    const existingSnap = await getDoc(ref);
    if (existingSnap.exists()) {
      await updateDoc(ref, {
        title: record.title,
        summary: record.summary,
        platform: record.platform,
        tags: record.tags,
        payload: record.payload,
        category: record.category,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        id: record.id,
        userId: uid,
        category: record.category,
        title: record.title,
        summary: record.summary,
        platform: record.platform,
        tags: record.tags,
        payload: record.payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return record;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteLibraryItemStorage(mode: 'firebase' | 'demo', id: string) {
  if (mode === 'demo') {
    const snap = readLocalDemo();
    snap.library = snap.library.filter((i) => i.id !== id);
    writeLocalDemo(snap);
    return;
  }
  const path = `libraryItems/${id}`;
  try {
    await deleteDoc(doc(db, 'libraryItems', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveCampaignStorage(
  mode: 'firebase' | 'demo',
  uid: string,
  campaign: Omit<CampaignPlan, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<CampaignPlan> {
  const id = campaign.id && /^[a-zA-Z0-9_-]+$/.test(campaign.id) ? campaign.id : makeSafeId('camp');
  const now = new Date().toISOString();
  const record: CampaignPlan = {
    ...campaign,
    id,
    title: campaign.title.trim().slice(0, 200) || 'Untitled Campaign',
    topic: campaign.topic.trim().slice(0, 300),
    objective: campaign.objective.trim().slice(0, 300),
    audience: campaign.audience.trim().slice(0, 200),
    duration: campaign.duration.trim().slice(0, 60),
    platform: campaign.platform.trim().slice(0, 60),
    overview: campaign.overview.trim().slice(0, 4000),
    days: campaign.days.slice(0, 60),
    checklist: campaign.checklist.slice(0, 50),
    createdAt: now,
    updatedAt: now,
  };

  if (mode === 'demo') {
    const snap = readLocalDemo();
    const idx = snap.campaigns.findIndex((c) => c.id === id);
    if (idx >= 0) {
      record.createdAt = snap.campaigns[idx].createdAt;
      snap.campaigns[idx] = record;
    } else {
      snap.campaigns.unshift(record);
    }
    writeLocalDemo(snap);
    return record;
  }

  const path = `campaigns/${id}`;
  try {
    const ref = doc(db, 'campaigns', id);
    const existingSnap = await getDoc(ref);
    if (existingSnap.exists()) {
      await updateDoc(ref, {
        title: record.title,
        overview: record.overview,
        days: record.days,
        checklist: record.checklist,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        id: record.id,
        userId: uid,
        title: record.title,
        topic: record.topic,
        objective: record.objective,
        audience: record.audience,
        duration: record.duration,
        platform: record.platform,
        overview: record.overview,
        status: record.status,
        days: record.days,
        checklist: record.checklist,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return record;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateCampaignStatusStorage(
  mode: 'firebase' | 'demo',
  id: string,
  status: CampaignPlan['status']
) {
  if (mode === 'demo') {
    const snap = readLocalDemo();
    snap.campaigns = snap.campaigns.map((c) => (c.id === id ? { ...c, status, updatedAt: new Date().toISOString() } : c));
    writeLocalDemo(snap);
    return;
  }
  const path = `campaigns/${id}`;
  try {
    await updateDoc(doc(db, 'campaigns', id), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function saveCalendarEntryStorage(
  mode: 'firebase' | 'demo',
  uid: string,
  entry: Omit<CalendarEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<CalendarEntry> {
  const id = entry.id && /^[a-zA-Z0-9_-]+$/.test(entry.id) ? entry.id : makeSafeId('cal');
  const now = new Date().toISOString();
  const record: CalendarEntry = {
    id,
    userId: uid,
    title: entry.title.trim().slice(0, 200) || 'Untitled Post',
    date: entry.date.slice(0, 20),
    timeSlot: (entry.timeSlot || '12:00').slice(0, 20),
    platform: (entry.platform || 'Instagram').slice(0, 60),
    status: entry.status,
    notes: (entry.notes || '').slice(0, 2000),
    reminderAt: (entry.reminderAt || '').slice(0, 40),
    linkedScriptId: (entry.linkedScriptId || '').slice(0, 128),
    linkedScriptTitle: (entry.linkedScriptTitle || '').slice(0, 200),
    linkedCaptionId: (entry.linkedCaptionId || '').slice(0, 128),
    linkedCaptionTitle: (entry.linkedCaptionTitle || '').slice(0, 200),
    createdAt: now,
    updatedAt: now,
  };

  if (mode === 'demo') {
    const snap = readLocalDemo();
    const idx = snap.calendar.findIndex((c) => c.id === id);
    if (idx >= 0) {
      record.createdAt = snap.calendar[idx].createdAt;
      snap.calendar[idx] = record;
    } else {
      snap.calendar.push(record);
    }
    snap.calendar.sort((a, b) => a.date.localeCompare(b.date));
    writeLocalDemo(snap);
    return record;
  }

  const path = `calendarEntries/${id}`;
  try {
    const ref = doc(db, 'calendarEntries', id);
    const existingSnap = await getDoc(ref);
    if (existingSnap.exists()) {
      await updateDoc(ref, {
        title: record.title,
        date: record.date,
        timeSlot: record.timeSlot,
        platform: record.platform,
        notes: record.notes,
        reminderAt: record.reminderAt,
        linkedScriptId: record.linkedScriptId,
        linkedScriptTitle: record.linkedScriptTitle,
        linkedCaptionId: record.linkedCaptionId,
        linkedCaptionTitle: record.linkedCaptionTitle,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        id: record.id,
        userId: uid,
        title: record.title,
        date: record.date,
        timeSlot: record.timeSlot,
        platform: record.platform,
        status: record.status,
        notes: record.notes,
        reminderAt: record.reminderAt,
        linkedScriptId: record.linkedScriptId,
        linkedScriptTitle: record.linkedScriptTitle,
        linkedCaptionId: record.linkedCaptionId,
        linkedCaptionTitle: record.linkedCaptionTitle,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return record;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateCalendarStatusStorage(
  mode: 'firebase' | 'demo',
  id: string,
  status: CalendarEntry['status']
) {
  if (mode === 'demo') {
    const snap = readLocalDemo();
    snap.calendar = snap.calendar.map((c) =>
      c.id === id ? { ...c, status, updatedAt: new Date().toISOString() } : c
    );
    writeLocalDemo(snap);
    return;
  }
  const path = `calendarEntries/${id}`;
  try {
    await updateDoc(doc(db, 'calendarEntries', id), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteCalendarEntryStorage(mode: 'firebase' | 'demo', id: string) {
  if (mode === 'demo') {
    const snap = readLocalDemo();
    snap.calendar = snap.calendar.filter((c) => c.id !== id);
    writeLocalDemo(snap);
    return;
  }
  const path = `calendarEntries/${id}`;
  try {
    await deleteDoc(doc(db, 'calendarEntries', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function logActivityStorage(
  mode: 'firebase' | 'demo',
  uid: string,
  tool: string,
  title: string
): Promise<ActivityLog> {
  const id = makeSafeId('act');
  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10);
  const log: ActivityLog = {
    id,
    userId: uid,
    tool: tool.slice(0, 60),
    title: title.slice(0, 200),
    dateKey,
    createdAt: now.toISOString(),
  };

  if (mode === 'demo') {
    const snap = readLocalDemo();
    snap.activityLogs.push(log);
    writeLocalDemo(snap);
    return log;
  }

  const path = `activityLogs/${id}`;
  try {
    await setDoc(doc(db, 'activityLogs', id), {
      id: log.id,
      userId: uid,
      tool: log.tool,
      title: log.title,
      dateKey: log.dateKey,
      createdAt: serverTimestamp(),
    });
    return log;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}
