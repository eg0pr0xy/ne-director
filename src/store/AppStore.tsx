import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AttentionItem, FocusMode, Person, TimelineEvent, TodayState, Project } from '../types';
import { apiService } from '../services/api';
import { DirectorSettings } from "../types/settings";
import { defaultSettings } from "../mocks/defaultSettings";
import { DirectorProfile } from "../types/profile";
import { defaultProfile } from "../mocks/defaultProfile";
import { agentControlApi, agentControlApiEnabled, type OperatorControls } from '../services/agentControls';

export type AppPage = 'TODAY' | 'ATTENTION' | 'PROJECTS' | 'PEOPLE' | 'TIMELINE' | 'SEARCH' | 'CHAT' | 'SETTINGS' | 'PROFILE';

interface AppState {
  currentPage: AppPage;
  focusMode: FocusMode;
  todayState: TodayState | null;
  loading: boolean;
  loadError: string | null;
  selectedItem: AttentionItem | null; // For context drawer
  isDrawerOpen: boolean;
  toastMessage: string | null;
  
  // Profile & User
  profile: DirectorProfile;
  updateProfile: (updates: Partial<DirectorProfile>) => void;
  resetProfile: () => void;
  
  // Settings Navigation Target
  settingsCategory: string | null;
  setSettingsCategory: (category: string | null) => void;
  openSettings: (category?: string) => void;

  // Workspaces
  projects: Project[];
  people: Person[];
  attentionItems: AttentionItem[];
  allTimeline: TimelineEvent[];
  settings: DirectorSettings;
  authorityAvailable: boolean;
  updateSettings: (newSettings: DirectorSettings) => void;
  resetSettings: () => void;

  setCurrentPage: (page: AppPage) => void;
  setFocusMode: (mode: FocusMode) => void;
  openDrawer: (item: AttentionItem) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
  hideToast: () => void;
  approveDecision: (itemId: string, decisionLabel: string) => Promise<void>;
  getPerson: (id: string) => Person | undefined;
  getProject: (id: string) => Project | undefined;
}

const AppContext = createContext<AppState | undefined>(undefined);

const flattenAutonomy = (autonomy: DirectorSettings['autonomy']) => ({ createInternalHolds: autonomy.calendar.createInternalHolds, moveInternalMeetings: autonomy.calendar.moveInternalMeetings, moveExternalMeetings: autonomy.calendar.moveExternalMeetings, cancelMeetings: autonomy.calendar.cancelMeetings, draftInternalReplies: autonomy.communication.draftInternalReplies, sendInternalReplies: autonomy.communication.sendInternalReplies, draftExternalReplies: autonomy.communication.draftExternalReplies, sendExternalReplies: autonomy.communication.sendExternalReplies, sendFollowUps: autonomy.communication.sendFollowUps, distributeApproved: autonomy.documents.distributeApproved, shareConfidential: autonomy.documents.shareConfidential, updateInternalState: autonomy.production.updateInternalState, resolveDependency: autonomy.production.resolveDependency, changeSchedule: autonomy.production.changeSchedule, bookTravel: autonomy.financial.bookTravel });
const displayPermission = (value: string) => value === 'SUGGEST_ONLY' ? 'Suggest Only' : value === 'APPROVAL_REQUIRED' ? 'Approval Required' : 'Allowed';
const applyControls = (settings: DirectorSettings, controls: OperatorControls): DirectorSettings => ({ ...settings, chiefOfStaff: controls.chiefOfStaff, autonomy: { ...settings.autonomy, isPaused: controls.globalPause, calendar: { createInternalHolds: displayPermission(controls.globalAutonomy.createInternalHolds) as any, moveInternalMeetings: displayPermission(controls.globalAutonomy.moveInternalMeetings) as any, moveExternalMeetings: displayPermission(controls.globalAutonomy.moveExternalMeetings) as any, cancelMeetings: displayPermission(controls.globalAutonomy.cancelMeetings) as any }, communication: { draftInternalReplies: displayPermission(controls.globalAutonomy.draftInternalReplies) as any, sendInternalReplies: displayPermission(controls.globalAutonomy.sendInternalReplies) as any, draftExternalReplies: displayPermission(controls.globalAutonomy.draftExternalReplies) as any, sendExternalReplies: displayPermission(controls.globalAutonomy.sendExternalReplies) as any, sendFollowUps: displayPermission(controls.globalAutonomy.sendFollowUps) as any }, documents: { ...settings.autonomy.documents, distributeApproved: displayPermission(controls.globalAutonomy.distributeApproved) as any, shareConfidential: displayPermission(controls.globalAutonomy.shareConfidential) as any }, production: { ...settings.autonomy.production, updateInternalState: displayPermission(controls.globalAutonomy.updateInternalState) as any, resolveDependency: displayPermission(controls.globalAutonomy.resolveDependency) as any, changeSchedule: displayPermission(controls.globalAutonomy.changeSchedule) as any }, financial: { ...settings.autonomy.financial, bookTravel: displayPermission(controls.globalAutonomy.bookTravel) as any } } });
const apiPermission = (value: string) => value === 'Suggest Only' ? 'SUGGEST_ONLY' : value === 'Approval Required' ? 'APPROVAL_REQUIRED' : 'ALLOWED';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<AppPage>('TODAY');
  const [focusMode, setFocusMode] = useState<FocusMode>('NORMAL');
  const [todayState, setTodayState] = useState<TodayState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const [selectedItem, setSelectedItem] = useState<AttentionItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Profile state with local persistence
  const [profile, setProfile] = useState<DirectorProfile>(() => {
    const saved = localStorage.getItem("ne_director_profile_v1");
    if (saved) {
      try {
        return { ...defaultProfile, ...JSON.parse(saved) };
      } catch (e) {
        console.error("Error loading saved profile:", e);
      }
    }
    return defaultProfile;
  });

  const [settingsCategory, setSettingsCategory] = useState<string | null>(null);

  const updateProfile = (updates: Partial<DirectorProfile>) => {
    setProfile(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem("ne_director_profile_v1", JSON.stringify(next));
      return next;
    });
  };

  const resetProfile = () => {
    setProfile(defaultProfile);
    localStorage.setItem("ne_director_profile_v1", JSON.stringify(defaultProfile));
    showToast("Profile restored to Marcus Director prototype");
  };

  const openSettings = (category?: string) => {
    if (category) {
      setSettingsCategory(category);
    }
    setCurrentPage('SETTINGS');
  };

  const [projects, setProjects] = useState<Project[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([]);
  const [allTimeline, setAllTimeline] = useState<TimelineEvent[]>([]);
  const [settings, setSettings] = useState<DirectorSettings>(() => {
    if (agentControlApiEnabled) return defaultSettings;
    const saved = localStorage.getItem("ne_director_settings");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return defaultSettings;
  });
  const [operatorControls, setOperatorControls] = useState<OperatorControls | null>(null);
  const [authorityAvailable, setAuthorityAvailable] = useState(!agentControlApiEnabled);

  useEffect(() => {
    if (!agentControlApiEnabled) localStorage.setItem("ne_director_settings", JSON.stringify(settings));
    
    if (settings.appearance.theme === "White") {
      document.documentElement.classList.add("theme-white");
      document.documentElement.classList.remove("dark");
    } else if (settings.appearance.theme === "Black") {
      document.documentElement.classList.remove("theme-white");
      document.documentElement.classList.add("dark");
    } else {
      if (window.matchMedia("(prefers-color-scheme: light)").matches) {
        document.documentElement.classList.add("theme-white");
        document.documentElement.classList.remove("dark");
      } else {
        document.documentElement.classList.remove("theme-white");
        document.documentElement.classList.add("dark");
      }
    }
  }, [settings]);

  const updateSettings = (newSettings: DirectorSettings) => {
    if (!agentControlApiEnabled) { setSettings(newSettings); return; }
    if (!operatorControls) return;
    agentControlApi.updateControls({ version: operatorControls.version, globalPause: newSettings.autonomy.isPaused, globalAutonomy: Object.fromEntries(Object.entries(flattenAutonomy(newSettings.autonomy)).map(([key, value]) => [key, apiPermission(value)])), chiefOfStaff: newSettings.chiefOfStaff }).then(controls => { setOperatorControls(controls); setSettings(previous => applyControls({ ...previous, ...newSettings }, controls)); setAuthorityAvailable(true); }).catch(() => { setAuthorityAvailable(false); setLoadError('Operator controls are unavailable. Authority settings remain disabled.'); });
  };

  const resetSettings = () => {
    updateSettings(defaultSettings);
  };

  useEffect(() => {
    if (!agentControlApiEnabled) return;
    agentControlApi.controls().then(controls => { setOperatorControls(controls); setSettings(previous => applyControls(previous, controls)); setAuthorityAvailable(true); }).catch(() => { setAuthorityAvailable(false); setLoadError('Operator controls unavailable. No local authority settings are used.'); });
  }, []);


  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [data, peopleData, projectsData, attentionData, timelineData] = await Promise.all([apiService.getToday(), apiService.getPeople(), apiService.getProjects(), apiService.getAttention(), apiService.getTimeline()]);
        setTodayState(data); setPeople(peopleData); setProjects(projectsData); setAttentionItems(attentionData); setAllTimeline(timelineData);
      } catch {
        setLoadError('Director API unavailable. No mock data is being shown.');
      } finally { setLoading(false); }
    };
    loadData();
  }, []);

  const openDrawer = (item: AttentionItem) => {
    setSelectedItem(item);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const hideToast = () => setToastMessage(null);

  const approveDecision = async (itemId: string, decisionLabel: string) => {
    if (!todayState) return;
    if (import.meta.env.VITE_DIRECTOR_RUNTIME_MODE === 'api') {
      try {
        await apiService.recordDecision(itemId, 'LOCATION_B');
        const [data, peopleData, projectsData, attentionData, timelineData] = await Promise.all([apiService.getToday(), apiService.getPeople(), apiService.getProjects(), apiService.getAttention(), apiService.getTimeline()]);
        setTodayState(data); setPeople(peopleData); setProjects(projectsData); setAttentionItems(attentionData); setAllTimeline(timelineData);
        showToast(`Approved ${decisionLabel}`); closeDrawer(); return;
      } catch { showToast('Decision could not be recorded. No mock fallback was used.'); return; }
    }

    // Remove from Needs You globally
    const updatedAttentionItems = attentionItems.map(i => 
      i.id === itemId ? { ...i, status: 'resolved' as const } : i
    );
    setAttentionItems(updatedAttentionItems);

    const updatedNeedsYou = todayState.needsYou.filter(i => i.id !== itemId);
    
    // Add to handled
    const newHandled = {
      id: `h_new_${Date.now()}`,
      description: `Approved ${decisionLabel}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Add to timeline
    const newTimelineEvent: TimelineEvent = {
      id: `t_new_${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      description: `You approved ${decisionLabel}`,
      source: 'CHIEF_OF_STAFF',
      isHumanDecision: true
    };
    
    // Add subsequent timeline events automatically
    const subsequentEvents: TimelineEvent[] = [
      {
        id: `t_sub1_${Date.now()}`,
        time: new Date(Date.now() + 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        description: `Producer informed\nAnna Meyer received your approved ${decisionLabel} decision.`,
        source: 'CHIEF_OF_STAFF'
      },
      {
        id: `t_sub2_${Date.now()}`,
        time: new Date(Date.now() + 120000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        description: `Location dependency resolved`,
        source: 'ORDO'
      }
    ];

    setAllTimeline([newTimelineEvent, ...subsequentEvents, ...allTimeline]);

    // Update Project state (decrease needsYouCount)
    setProjects(projects.map(p => {
      // Find if this attention item belonged to a project
      const item = attentionItems.find(a => a.id === itemId);
      if (item && item.projectId === p.id && p.needsYouCount > 0) {
        return { ...p, needsYouCount: p.needsYouCount - 1 };
      }
      return p;
    }));

    // Update the associated person's open count using the same decision record.
    setPeople(people.map(p => {
      const item = attentionItems.find(a => a.id === itemId);
      if (item && item.personId === p.id && (p.openItemsCount ?? 0) > 0) {
        return { ...p, openItemsCount: (p.openItemsCount ?? 0) - 1 };
      }
      return p;
    }));

    setTodayState({
      ...todayState,
      needsYou: updatedNeedsYou,
      handled: [newHandled, ...todayState.handled],
      timeline: [newTimelineEvent, ...subsequentEvents, ...todayState.timeline]
    });
    
    showToast(`Approved ${decisionLabel}`);
    closeDrawer();
  };

  const getPerson = (id: string) => people.find(p => p.id === id);
  const getProject = (id: string) => projects.find(p => p.id === id);

  return (
    <AppContext.Provider value={{
      currentPage, setCurrentPage,
      focusMode, setFocusMode,
      todayState, loading, loadError,
      selectedItem, isDrawerOpen, openDrawer, closeDrawer,
      toastMessage, showToast, hideToast,
      profile, updateProfile, resetProfile,
      settingsCategory, setSettingsCategory, openSettings,
      projects, people, attentionItems, allTimeline, settings, authorityAvailable, updateSettings, resetSettings,
      approveDecision, getPerson, getProject
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
