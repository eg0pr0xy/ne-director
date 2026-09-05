export type SourceSystem = 'ORDO' | 'NARRATE' | 'PRESENCE' | 'MNEME' | 'IMPERIUM MENTIS' | 'CHIEF_OF_STAFF' | 'COMMUNICATION' | 'CALENDAR';

export interface Project {
  id: string;
  name: string;
  type: string;
  status: string;
  shootDay?: string;
  productionStatus?: string;
  needsYouCount?: number;
  openDecisions?: number;
  risks?: number;
  nextEvent?: string;
  shootStarts?: string;
}

export interface Person {
  id: string;
  name: string;
  role: string;
  projectId?: string;
  avatarUrl?: string;
  relationship?: string;
  openItemsCount?: number;
  nextInteraction?: string;
}

export interface AttentionItem {
  id: string;
  title: string;
  subtitle: string;
  deadline?: string;
  remainingTime?: string;
  status: 'needs_you' | 'waiting' | 'delegated' | 'fyi' | 'resolved';
  source: { system: SourceSystem; referenceId?: string };
  personId?: string;
  projectId?: string;
  thumbnailUrl?: string;
  type: 'decision' | 'review' | 'fyi';
  context?: {
    recommendation?: string;
    why?: string[];
    details?: string;
  };
}

export interface CalendarEvent {
  id: string;
  time: string;
  title: string;
  location: string;
  type: 'meeting' | 'shoot' | 'personal' | 'review';
}

export interface OpenLoop {
  id: string;
  personId: string;
  task: string;
  timeRemaining: string;
}

export interface HandledAction {
  id: string;
  description: string;
  time: string;
  agentId?: string;
  artifactId?: string;
  externalActions?: 'NONE';
}

export interface OperationalInsight {
  id: string;
  description: string;
  type: 'financial' | 'schedule' | 'logistical' | 'creative';
}

export interface TimelineEvent {
  id: string;
  time: string;
  description: string;
  source: SourceSystem;
  isHumanDecision?: boolean;
}

export interface ChiefOfStaffMessage {
  id: string;
  sender: 'user' | 'agent';
  content: string;
  timestamp: string;
}

export interface TodayState {
  needsYou: AttentionItem[];
  calendar: CalendarEvent[];
  waitingFor: OpenLoop[];
  handled: HandledAction[];
  insights: OperationalInsight[];
  timeline: TimelineEvent[];
}

export type FocusMode = 'NORMAL' | 'ON_SET' | 'DEVELOPMENT' | 'TRAVEL' | 'FESTIVAL' | 'DEEP_WORK';
