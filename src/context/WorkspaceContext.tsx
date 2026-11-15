import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../config/firebase';
import type {
  ActivityLog,
  BrandVoiceConfig,
  CalendarEntry,
  CampaignPlan,
  CreatorProfileAnalysis,
  DashboardPageId,
  LibraryItem,
} from '../types/ideonix';
import { DEFAULT_BRAND_VOICE } from '../services/sampleData';
import {
  deleteCalendarEntryStorage,
  deleteLibraryItemStorage,
  loadWorkspaceData,
  logActivityStorage,
  resetLocalDemoWorkspace,
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
export type StorageMode = 'firebase' | 'demo';

interface WorkspaceContextValue {
  view: AppView;
  setView: (view: AppView) => void;
  activePage: DashboardPageId;
  setActivePage: (page: DashboardPageId) => void;
  authLoading: boolean;
  workspaceLoading: boolean;
  firebaseUser: User | null;
  demoMode: boolean;
  storageMode: StorageMode;
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
  enterDemoMode: () => void;
  resetDemoData: () => void;
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

function isMobileOrIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  const isIosSafari = /iP(ad|hone|od)/i.test(ua) && /WebKit/i.test(ua) && !/CriOS|FxiOS/i.test(ua);
  return isMobile || isIosSafari;
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') return 'dashboard';
      if (window.location.pathname === '/login') return 'login';
      if (window.location.pathname.startsWith('/dashboard')) return 'dashboard';
    }
    return 'landing';
  });
  const [activePage, setActivePage] = useState<DashboardPageId>('overview');
  const [authLoading, setAuthLoading] = useState(true);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [demoMode, setDemoMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') return true;
      return sessionStorage.getItem('ideonix_demo_active') === '1';
    }
    return false;
  });

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

  // Storage mode switches automatically to local demo if user explicitly clicked demo or has an unverified email waiting
  const storageMode: StorageMode =
    firebaseUser && firebaseUser.emailVerified && !demoMode ? 'firebase' : 'demo';
  const effectiveUid = firebaseUser?.uid || 'demo-user';

  const hydrateWorkspace = useCallback(
    async (user: User | null, isDemo: boolean) => {
      if (!user && !isDemo) return;
      setWorkspaceLoading(true);
      try {
        const mode: StorageMode = user && user.emailVerified && !isDemo ? 'firebase' : 'demo';
        const data = await loadWorkspaceData({
          mode,
          uid: user?.uid || 'demo-user',
          email: user?.email || 'demo@ideonix.app',
          displayName: user?.displayName || 'Demo Creator',
          emailVerified: Boolean(user?.emailVerified),
        });
        setBrandVoice(data.brandVoice);
        setCreatorProfile(data.creatorProfile);
        setLibrary(data.library);
        setCampaigns(data.campaigns);
        setCalendar(data.calendar);
        setActivityLogs(data.activityLogs);
      } catch (err) {
        console.error('Failed to load workspace:', err);
        // If Firestore rules reject (e.g. quota or permissions), surface clearly
        notify('Could not sync cloud workspace. Using local workspace view.', 'error');
      } finally {
        setWorkspaceLoading(false);
      }
    },
    [notify]
  );

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setAuthLoading(false);
      if (demoMode) {
        hydrateWorkspace(null, true);
      }
      return;
    }

    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setDemoMode(false);
          sessionStorage.removeItem('ideonix_demo_active');
          setView('dashboard');
          notify(`Welcome back, ${result.user.displayName || result.user.email}`);
        }
      })
      .catch((err) => {
        notify(mapFirebaseAuthError(err?.code || err?.message || ''), 'error');
      });

    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthLoading(false);
      if (user) {
        setDemoMode(false);
        sessionStorage.removeItem('ideonix_demo_active');
        setView((prev) => (prev === 'login' ? 'dashboard' : prev));
        hydrateWorkspace(user, false);
      } else if (demoMode) {
        hydrateWorkspace(null, true);
      }
    });

    return () => unsub();
  }, [demoMode, hydrateWorkspace, notify]);

  const signInWithGoogle = useCallback(async () => {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase is not configured. Use Demo Workspace to explore.');
    }
    try {
      if (isMobileOrIosSafari()) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user) {
        setDemoMode(false);
        sessionStorage.removeItem('ideonix_demo_active');
        setView('dashboard');
        notify(`Signed in as ${cred.user.displayName || cred.user.email}`);
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      throw new Error(mapFirebaseAuthError(code || (err instanceof Error ? err.message : '')));
    }
  }, [notify]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        setDemoMode(false);
        sessionStorage.removeItem('ideonix_demo_active');
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
        setDemoMode(false);
        sessionStorage.removeItem('ideonix_demo_active');
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
    setDemoMode(false);
    sessionStorage.removeItem('ideonix_demo_active');
    if (auth.currentUser) {
      await signOut(auth);
    }
    setFirebaseUser(null);
    setView('landing');
    notify('Signed out cleanly.');
  }, [notify]);

  const enterDemoMode = useCallback(() => {
    setDemoMode(true);
    sessionStorage.setItem('ideonix_demo_active', '1');
    setView('dashboard');
    setActivePage('overview');
    hydrateWorkspace(null, true);
  }, [hydrateWorkspace]);

  const resetDemoData = useCallback(() => {
    const fresh = resetLocalDemoWorkspace();
    setBrandVoice(fresh.brandVoice);
    setCreatorProfile(fresh.creatorProfile);
    setLibrary(fresh.library);
    setCampaigns(fresh.campaigns);
    setCalendar(fresh.calendar);
    setActivityLogs(fresh.activityLogs);
    notify('Demo sample workspace restored.');
  }, [notify]);

  const saveBrandVoice = useCallback(
    async (config: BrandVoiceConfig) => {
      await saveBrandVoiceStorage(storageMode, effectiveUid, config);
      setBrandVoice({ ...config, updatedAt: new Date().toISOString() });
      notify(`Brand voice "${config.preset}" saved and applied to future generations.`);
    },
    [effectiveUid, notify, storageMode]
  );

  const saveCreatorProfile = useCallback(
    async (analysis: CreatorProfileAnalysis) => {
      await saveCreatorProfileStorage(storageMode, effectiveUid, analysis);
      setCreatorProfile(analysis);
    },
    [effectiveUid, storageMode]
  );

  const saveLibraryItem = useCallback(
    async (item: Omit<LibraryItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      const saved = await saveLibraryItemStorage(storageMode, effectiveUid, item);
      setLibrary((prev) => {
        const exists = prev.some((x) => x.id === saved.id);
        return exists ? prev.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...prev];
      });
      notify(`Saved "${saved.title}" to My Library.`);
      return saved;
    },
    [effectiveUid, notify, storageMode]
  );

  const deleteLibraryItem = useCallback(
    async (id: string) => {
      await deleteLibraryItemStorage(storageMode, id);
      setLibrary((prev) => prev.filter((i) => i.id !== id));
      notify('Removed item from My Library.');
    },
    [notify, storageMode]
  );

  const saveCampaign = useCallback(
    async (campaign: Omit<CampaignPlan, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      const saved = await saveCampaignStorage(storageMode, effectiveUid, campaign);
      setCampaigns((prev) => {
        const exists = prev.some((x) => x.id === saved.id);
        return exists ? prev.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...prev];
      });
      notify(`Campaign "${saved.title}" saved.`);
      return saved;
    },
    [effectiveUid, notify, storageMode]
  );

  const updateCampaignStatus = useCallback(
    async (id: string, status: CampaignPlan['status']) => {
      await updateCampaignStatusStorage(storageMode, id, status);
      setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
      notify(`Campaign marked as ${status}.`);
    },
    [notify, storageMode]
  );

  const saveCalendarEntry = useCallback(
    async (entry: Omit<CalendarEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      const saved = await saveCalendarEntryStorage(storageMode, effectiveUid, entry);
      setCalendar((prev) => {
        const exists = prev.some((x) => x.id === saved.id);
        const next = exists ? prev.map((x) => (x.id === saved.id ? saved : x)) : [...prev, saved];
        return next.sort((a, b) => a.date.localeCompare(b.date));
      });
      notify(`Scheduled "${saved.title}" on ${saved.date}.`);
      return saved;
    },
    [effectiveUid, notify, storageMode]
  );

  const updateCalendarStatus = useCallback(
    async (id: string, status: CalendarEntry['status']) => {
      await updateCalendarStatusStorage(storageMode, id, status);
      setCalendar((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
      notify(`Schedule status updated to ${status}.`);
    },
    [notify, storageMode]
  );

  const deleteCalendarEntry = useCallback(
    async (id: string) => {
      await deleteCalendarEntryStorage(storageMode, id);
      setCalendar((prev) => prev.filter((c) => c.id !== id));
      notify('Deleted calendar entry.');
    },
    [notify, storageMode]
  );

  const recordActivity = useCallback(
    async (tool: string, title: string) => {
      try {
        const log = await logActivityStorage(storageMode, effectiveUid, tool, title);
        setActivityLogs((prev) => [...prev, log]);
      } catch {
        // non-blocking activity log
      }
    },
    [effectiveUid, storageMode]
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
        demoMode,
        storageMode,
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
        enterDemoMode,
        resetDemoData,
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
