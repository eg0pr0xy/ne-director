import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AttentionItem, FocusMode, Person, TimelineEvent, TodayState, Project } from '../types';
import { apiService } from '../services/api';
import { DirectorSettings } from "../types/settings";
import { defaultSettings } from "../mocks/defaultSettings";
import { DirectorProfile } from "../types/profile";
import { defaultProfile } from "../mocks/defaultProfile";

export type AppPage = 'TODAY' | 'ATTENTION' | 'PROJECTS' | 'PEOPLE' | 'TIMELINE' | 'SEARCH' | 'CHAT' | 'SETTINGS' | 'PROFILE';

interface AppState {
  currentPage: AppPage;
  focusMode: FocusMode;
  todayState: TodayState | null;
  loading: boolean;
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
  updateSettings: (newSettings: DirectorSettings) => void;
  resetSettings: () => void;

  setCurrentPage: (page: AppPage) => void;
  setFocusMode: (mode: FocusMode) => void;
  openDrawer: (item: AttentionItem) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
  hideToast: () => void;
  approveDecision: (itemId: string, decisionLabel: string) => void;
  getPerson: (id: string) => Person | undefined;
  getProject: (id: string) => Project | undefined;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<AppPage>('TODAY');
  const [focusMode, setFocusMode] = useState<FocusMode>('NORMAL');
  const [todayState, setTodayState] = useState<TodayState | null>(null);
  const [loading, setLoading] = useState(true);
  
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
    const saved = localStorage.getItem("ne_director_settings");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem("ne_director_settings", JSON.stringify(settings));
    
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
    setSettings(newSettings);
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };


  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await apiService.getToday();
      const peopleData = await apiService.getPeople();
      const projectsData = await apiService.getProjects();
      const attentionData = await apiService.getAttention();
      const timelineData = await apiService.getTimeline();
      
      setTodayState(data);
      setPeople(peopleData);
      setProjects(projectsData);
      setAttentionItems(attentionData);
      setAllTimeline(timelineData);
      
      setLoading(false);
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

  const approveDecision = (itemId: string, decisionLabel: string) => {
    if (!todayState) return;

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

    // Update People state (decrease needsYouCount)
    setPeople(people.map(p => {
      const item = attentionItems.find(a => a.id === itemId);
      if (item && item.personId === p.id && p.needsYouCount > 0) {
        return { ...p, needsYouCount: p.needsYouCount - 1 };
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
      todayState, loading,
      selectedItem, isDrawerOpen, openDrawer, closeDrawer,
      toastMessage, showToast, hideToast,
      profile, updateProfile, resetProfile,
      settingsCategory, setSettingsCategory, openSettings,
      projects, people, attentionItems, allTimeline, settings, updateSettings, resetSettings,
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
