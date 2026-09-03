import { DirectorSettings } from '../types/settings';

export const defaultSettings: DirectorSettings = {
  appearance: {
    theme: 'Black',
    density: 'Comfortable',
    reduceMotion: false,
  },
  chiefOfStaff: {
    proactivity: 'BALANCED',
    dailyBrief: false,
    dailyBriefTime: '08:00',
    endOfDayReview: false,
    endOfDayReviewTime: '18:30',
    autoMeetingPrep: false,
    meetingPrepMinutes: 60,
    followUpThresholdHours: 24,
  },
  attention: {
    level: 'STANDARD',
    interruptions: {
      productionBlockers: true,
      decisionsRequiringMe: true,
      travelDisruption: true,
      deadlinesUnder2Hours: true,
      priorityContacts: true,
      generalFYI: false,
      routineUpdates: false,
    },
    deadlineWarningHours: 2,
    showFyiOnToday: false,
  },
  autonomy: {
    calendar: {
      createInternalHolds: 'Allowed',
      moveInternalMeetings: 'Approval Required',
      moveExternalMeetings: 'Approval Required',
      cancelMeetings: 'Suggest Only',
    },
    communication: {
      draftInternalReplies: 'Allowed',
      sendInternalReplies: 'Approval Required',
      draftExternalReplies: 'Allowed',
      sendExternalReplies: 'Approval Required',
      sendFollowUps: 'Approval Required',
    },
    documents: {
      requestMissing: 'Allowed',
      distributeApproved: 'Approval Required',
      shareConfidential: 'Suggest Only',
    },
    production: {
      updateInternalState: 'Allowed',
      resolveDependency: 'Approval Required',
      changeSchedule: 'Suggest Only',
    },
    financial: {
      bookTravel: 'Suggest Only',
      approveSpending: 'Suggest Only',
      makePurchases: 'Suggest Only',
    },
    isPaused: false,
  },
  focusModes: {
    normal: { visibleCategories: { productionBlockers: true, decisions: true, calendar: true, travel: true, fyi: true, routineCommunication: true } },
    onSet: { visibleCategories: { productionBlockers: true, decisions: true, calendar: true, travel: true, fyi: false, routineCommunication: false } },
    development: { visibleCategories: { productionBlockers: false, decisions: true, calendar: true, travel: false, fyi: true, routineCommunication: true } },
    travel: { visibleCategories: { productionBlockers: true, decisions: true, calendar: true, travel: true, fyi: false, routineCommunication: false } },
    festival: { visibleCategories: { productionBlockers: true, decisions: false, calendar: true, travel: true, fyi: false, routineCommunication: false } },
    deepWork: { visibleCategories: { productionBlockers: true, decisions: false, calendar: false, travel: true, fyi: false, routineCommunication: false } },
  },
  projects: [
    { projectId: 'p1', priority: 'HIGH', showOnToday: true, confidential: true },
    { projectId: 'p2', priority: 'MEDIUM', showOnToday: true, confidential: false },
    { projectId: 'p3', priority: 'MEDIUM', showOnToday: false, confidential: false },
  ],
  people: [
    { personId: 'p1', isPriority: true, preferredChannel: 'Email' },
    { personId: 'p2', isPriority: false, preferredChannel: 'Message' },
  ],
  memory: {
    separation: true,
    activityHistoryDays: 30,
  },
  notifications: {
    desktop: true,
    mobile: true,
    emailSummary: false,
    quietHoursEnabled: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    allowCriticalAlerts: true,
  }
};
