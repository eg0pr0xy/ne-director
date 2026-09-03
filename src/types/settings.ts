export type ThemeAppearance = 'Black' | 'White' | 'System';
export type InterfaceDensity = 'Comfortable' | 'Compact';
export type ProactivityLevel = 'QUIET' | 'BALANCED' | 'PROACTIVE';
export type AttentionLevel = 'ONLY CRITICAL' | 'STANDARD' | 'HIGH AWARENESS';
export type AutonomyPermission = 'Suggest Only' | 'Approval Required' | 'Allowed';

export interface AppearanceSettings {
  theme: ThemeAppearance;
  density: InterfaceDensity;
  reduceMotion: boolean;
}

export interface ChiefOfStaffSettings {
  proactivity: ProactivityLevel;
  dailyBrief: boolean;
  dailyBriefTime: string;
  endOfDayReview: boolean;
  endOfDayReviewTime: string;
  autoMeetingPrep: boolean;
  meetingPrepMinutes: number;
  followUpThresholdHours: number;
}

export interface AttentionSettings {
  level: AttentionLevel;
  interruptions: {
    productionBlockers: boolean;
    decisionsRequiringMe: boolean;
    travelDisruption: boolean;
    deadlinesUnder2Hours: boolean;
    priorityContacts: boolean;
    generalFYI: boolean;
    routineUpdates: boolean;
  };
  deadlineWarningHours: number;
  showFyiOnToday: boolean;
}

export interface AutonomySettings {
  calendar: {
    createInternalHolds: AutonomyPermission;
    moveInternalMeetings: AutonomyPermission;
    moveExternalMeetings: AutonomyPermission;
    cancelMeetings: AutonomyPermission;
  };
  communication: {
    draftInternalReplies: AutonomyPermission;
    sendInternalReplies: AutonomyPermission;
    draftExternalReplies: AutonomyPermission;
    sendExternalReplies: AutonomyPermission;
    sendFollowUps: AutonomyPermission;
  };
  documents: {
    requestMissing: AutonomyPermission;
    distributeApproved: AutonomyPermission;
    shareConfidential: AutonomyPermission;
  };
  production: {
    updateInternalState: AutonomyPermission;
    resolveDependency: AutonomyPermission;
    changeSchedule: AutonomyPermission;
  };
  financial: {
    bookTravel: AutonomyPermission;
    approveSpending: AutonomyPermission;
    makePurchases: AutonomyPermission;
  };
  isPaused: boolean;
}

export interface FocusModeConfig {
  visibleCategories: {
    productionBlockers: boolean;
    decisions: boolean;
    calendar: boolean;
    travel: boolean;
    fyi: boolean;
    routineCommunication: boolean;
  };
}

export interface FocusModeSettings {
  normal: FocusModeConfig;
  onSet: FocusModeConfig;
  development: FocusModeConfig;
  travel: FocusModeConfig;
  festival: FocusModeConfig;
  deepWork: FocusModeConfig;
}

export interface ProjectPreference {
  projectId: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  showOnToday: boolean;
  confidential: boolean;
}

export interface PeoplePreference {
  personId: string;
  isPriority: boolean;
  preferredChannel: 'Email' | 'Phone' | 'Message';
}

export interface MemorySettings {
  separation: boolean;
  activityHistoryDays: number; // 30, 90, 365, 0 (forever)
}

export interface NotificationSettings {
  desktop: boolean;
  mobile: boolean;
  emailSummary: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  allowCriticalAlerts: boolean;
}

export interface DirectorSettings {
  appearance: AppearanceSettings;
  chiefOfStaff: ChiefOfStaffSettings;
  attention: AttentionSettings;
  autonomy: AutonomySettings;
  focusModes: FocusModeSettings;
  projects: ProjectPreference[];
  people: PeoplePreference[];
  memory: MemorySettings;
  notifications: NotificationSettings;
}
