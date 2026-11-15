import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../config/firebase';
import {
  DEFAULT_BRAND_VOICE,
  type ActivityLog,
  type BrandVoiceConfig,
  type CalendarEntry,
  type CampaignPlan,
  type CreatorProfileAnalysis,
  type DashboardPageId,
  type LibraryItem,
} from '../types/ideonix';
import {
  deleteCalendarEntryStorage,
  deleteLibraryItemStorage,
  loadWorkspaceData,
  logActivityStorage,
  saveBrandVoiceStorage,
  saveCalendarEntryStorage,
  saveCampaignStorage,
  saveCreatorProfileStorage,
  saveLibraryItemStorage,
  updateCalendarStatusStorage,
  updateCampaignStatusStorage,
} from '../services/workspaceStorage';
import { mapFirebaseAuthError } from '../utils/creatorHelpers';

export type AppView = 'landing' | 'login' | 'dashboard';

interface WorkspaceContextValue {
  view: AppView;
  setView: (view: AppView) => void;
  activePage: DashboardPageId;
  setActivePage: (page: DashboardPageId) => void;
  authLoading: boolean;
  workspaceLoading: boolean;
  firebaseUser: User | null;
  effectiveUid: string;
  brandVoice: BrandVoiceConfig;
  creatorProfile: CreatorProfileAnalysis | null;
  library: LibraryItem[];
  campaigns: CampaignPlan[];
  calendar: CalendarEntry[];
  activityLogs: ActivityLog[];
  toastMessage: { type: 'success' | 'error'; text: string } | null;
  clearToast: () => void;
  notify: (text: string, type?: 'success' | 'error') => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
  saveBrandVoice: (config: BrandVoiceConfig) => Promise<void>;
  saveCreatorProfile: (analysis: CreatorProfileAnalysis) => Promise<void>;
  saveLibraryItem: (
    item: Omit<LibraryItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => Promise<LibraryItem>;
  deleteLibraryItem: (id: string) => Promise<void>;
  saveCampaign: (
    campaign: Omit<CampaignPlan, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => Promise<CampaignPlan>;
  updateCampaignStatus: (id: string, status: CampaignPlan['status']) => Promise<void>;
  saveCalendarEntry: (
    entry: Omit<CalendarEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => Promise<CalendarEntry>;
  updateCalendarStatus: (id: string, status: CalendarEntry['status']) => Promise<void>;
  deleteCalendarEntry: (id: string) => Promise<void>;
  recordActivity: (tool: string, title: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname === '/login') return 'login';
      if (window.location.pathname.startsWith('/dashboard')) return 'dashboard';
    }
    return 'landing';
  });
  const [activePage, setActivePage] = useState<DashboardPageId>('overview');
  const [authLoading, setAuthLoading] = useState(true);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  const [brandVoice, setBrandVoice] = useState<BrandVoiceConfig>(DEFAULT_BRAND_VOICE);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfileAnalysis | null>(null);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignPlan[]>([]);
  const [calendar, setCalendar] = useState<CalendarEntry[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const notify = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
  }, []);

  const clearToast = useCallback(() => setToastMessage(null), []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 4500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const effectiveUid = firebaseUser?.uid || '';

  const resetWorkspaceState = useCallback(() => {
    setBrandVoice(DEFAULT_BRAND_VOICE);
    setCreatorProfile(null);
    setLibrary([]);
    setCampaigns([]);
    setCalendar([]);
    setActivityLogs([]);
  }, []);

  const hydrateWorkspace = useCallback(
    async (user: User | null) => {
      if (!user) {
        resetWorkspaceState();
        return;
      }
      setWorkspaceLoading(true);
      try {
        const data = await loadWorkspaceData({
          uid: user.uid,
          email: user.email || 'creator@ideonix.app',
          displayName: user.displayName || 'Creator',
          emailVerified: Boolean(user.emailVerified),
        });
        setBrandVoice(data.brandVoice);
        setCreatorProfile(data.creatorProfile);
        setLibrary(data.library);
        setCampaigns(data.campaigns);
        setCalendar(data.calendar);
        setActivityLogs(data.activityLogs);
      } catch (err) {
        console.error('Failed to load workspace:', err);
        notify('Could not load Cloud Firestore workspace. Check your connection or permissions.', 'error');
      } finally {
        setWorkspaceLoading(false);
      }
    },
    [notify, resetWorkspaceState]
  );

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setAuthLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthLoading(false);
      if (user) {
        setView((prev) => (prev === 'login' ? 'dashboard' : prev));
        hydrateWorkspace(user);
      } else {
        resetWorkspaceState();
        setView((prev) => (prev === 'dashboard' ? 'login' : prev));
      }
    });

    return () => unsub();
  }, [hydrateWorkspace, notify, resetWorkspaceState]);

  const requireVerifiedUid = useCallback((): string => {
    if (!firebaseUser) {
      notify('Please sign in to save changes.', 'error');
      throw new Error('Authentication required');
    }
    if (!firebaseUser.emailVerified) {
      notify('Please verify your email address before saving to Cloud Firestore.', 'error');
      throw new Error('Email verification required');
    }
    return firebaseUser.uid;
  }, [firebaseUser, notify]);

  const signInWithGoogle = useCallback(async () => {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase Authentication is not configured.');
    }
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user) {
        setView('dashboard');
        notify(`Signed in as ${cred.user.displayName || cred.user.email}`);
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      throw new Error(mapFirebaseAuthError(code || (err instanceof Error ? err.message : '')));
    }
  }, [notify]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        setView('dashboard');
        if (!cred.user.emailVerified) {
          notify('Signed in. Please verify your email to enable Firestore cloud writes.', 'error');
        } else {
          notify(`Welcome back, ${cred.user.displayName || cred.user.email}`);
        }
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code || '';
        throw new Error(mapFirebaseAuthError(code || (err instanceof Error ? err.message : '')));
      }
    },
    [notify]
  );

  const registerWithEmail = useCallback(
    async (name: string, email: string, password: string) => {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) {
          await updateProfile(cred.user, { displayName: name.trim() });
        }
        await sendEmailVerification(cred.user).catch(() => {});
        setView('dashboard');
        notify('Account created! Check your inbox for an email verification link.');
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code || '';
        throw new Error(mapFirebaseAuthError(code || (err instanceof Error ? err.message : '')));
      }
    },
    [notify]
  );

  const resetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      throw new Error(mapFirebaseAuthError(code || (err instanceof Error ? err.message : '')));
    }
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    if (!auth.currentUser) return;
    await sendEmailVerification(auth.currentUser);
    notify('Verification email sent. Refresh after clicking the link.');
  }, [notify]);

  const logout = useCallback(async () => {
    if (auth.currentUser) {
      await signOut(auth);
    }
    setFirebaseUser(null);
    resetWorkspaceState();
    setView('landing');
    notify('Signed out cleanly.');
  }, [notify, resetWorkspaceState]);

  const saveBrandVoice = useCallback(
    async (config: BrandVoiceConfig) => {
      const uid = requireVerifiedUid();
      try {
        await saveBrandVoiceStorage(uid, config);
        setBrandVoice({ ...config, updatedAt: new Date().toISOString() });
        notify(`Brand voice "${config.preset}" saved and applied to future generations.`);
      } catch (err) {
        notify('Could not save Brand Voice to cloud database.', 'error');
        throw err;
      }
    },
    [notify, requireVerifiedUid]
  );

  const saveCreatorProfile = useCallback(
    async (analysis: CreatorProfileAnalysis) => {
      const uid = requireVerifiedUid();
      try {
        await saveCreatorProfileStorage(uid, analysis);
        setCreatorProfile(analysis);
      } catch (err) {
        notify('Could not save Creator Profile to cloud database.', 'error');
        throw err;
      }
    },
    [notify, requireVerifiedUid]
  );

  const saveLibraryItem = useCallback(
    async (item: Omit<LibraryItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      const uid = requireVerifiedUid();
      try {
        const saved = await saveLibraryItemStorage(uid, item);
        setLibrary((prev) => {
          const exists = prev.some((x) => x.id === saved.id);
          return exists ? prev.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...prev];
        });
        notify(`Saved "${saved.title}" to My Library.`);
        return saved;
      } catch (err) {
        notify('Could not save item to My Library.', 'error');
        throw err;
      }
    },
    [notify, requireVerifiedUid]
  );

  const deleteLibraryItem = useCallback(
    async (id: string) => {
      requireVerifiedUid();
      try {
        await deleteLibraryItemStorage(id);
        setLibrary((prev) => prev.filter((i) => i.id !== id));
        notify('Removed item from My Library.');
      } catch (err) {
        notify('Could not delete item from My Library.', 'error');
        throw err;
      }
    },
    [notify, requireVerifiedUid]
  );

  const saveCampaign = useCallback(
    async (campaign: Omit<CampaignPlan, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      const uid = requireVerifiedUid();
      try {
        const saved = await saveCampaignStorage(uid, campaign);
        setCampaigns((prev) => {
          const exists = prev.some((x) => x.id === saved.id);
          return exists ? prev.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...prev];
        });
        notify(`Campaign "${saved.title}" saved.`);
        return saved;
      } catch (err) {
        notify('Could not save campaign to cloud database.', 'error');
        throw err;
      }
    },
    [notify, requireVerifiedUid]
  );

  const updateCampaignStatus = useCallback(
    async (id: string, status: CampaignPlan['status']) => {
      requireVerifiedUid();
      try {
        await updateCampaignStatusStorage(id, status);
        setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
        notify(`Campaign marked as ${status}.`);
      } catch (err) {
        notify('Could not update campaign status.', 'error');
        throw err;
      }
    },
    [notify, requireVerifiedUid]
  );

  const saveCalendarEntry = useCallback(
    async (entry: Omit<CalendarEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      const uid = requireVerifiedUid();
      try {
        const saved = await saveCalendarEntryStorage(uid, entry);
        setCalendar((prev) => {
          const exists = prev.some((x) => x.id === saved.id);
          const next = exists ? prev.map((x) => (x.id === saved.id ? saved : x)) : [...prev, saved];
          return next.sort((a, b) => a.date.localeCompare(b.date));
        });
        notify(`Scheduled "${saved.title}" on ${saved.date}.`);
        return saved;
      } catch (err) {
        notify('Could not save calendar entry.', 'error');
        throw err;
      }
    },
    [notify, requireVerifiedUid]
  );

  const updateCalendarStatus = useCallback(
    async (id: string, status: CalendarEntry['status']) => {
      requireVerifiedUid();
      try {
        await updateCalendarStatusStorage(id, status);
        setCalendar((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
        notify(`Schedule status updated to ${status}.`);
      } catch (err) {
        notify('Could not update schedule status.', 'error');
        throw err;
      }
    },
    [notify, requireVerifiedUid]
  );

  const deleteCalendarEntry = useCallback(
    async (id: string) => {
      requireVerifiedUid();
      try {
        await deleteCalendarEntryStorage(id);
        setCalendar((prev) => prev.filter((c) => c.id !== id));
        notify('Deleted calendar entry.');
      } catch (err) {
        notify('Could not delete calendar entry.', 'error');
        throw err;
      }
    },
    [notify, requireVerifiedUid]
  );

  const recordActivity = useCallback(
    async (tool: string, title: string) => {
      if (!firebaseUser || !firebaseUser.emailVerified) return;
      try {
        const log = await logActivityStorage(firebaseUser.uid, tool, title);
        setActivityLogs((prev) => [...prev, log]);
      } catch {
        // non-blocking activity log
      }
    },
    [firebaseUser]
  );

  return (
    <WorkspaceContext.Provider
      value={{
        view,
        setView,
        activePage,
        setActivePage,
        authLoading,
        workspaceLoading,
        firebaseUser,
        effectiveUid,
        brandVoice,
        creatorProfile,
        library,
        campaigns,
        calendar,
        activityLogs,
        toastMessage,
        clearToast,
        notify,
        signInWithGoogle,
        signInWithEmail,
        registerWithEmail,
        resetPassword,
        resendVerificationEmail,
        logout,
        saveBrandVoice,
        saveCreatorProfile,
        saveLibraryItem,
        deleteLibraryItem,
        saveCampaign,
        updateCampaignStatus,
        saveCalendarEntry,
        updateCalendarStatus,
        deleteCalendarEntry,
        recordActivity,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return ctx;
}
