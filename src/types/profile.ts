export type RepresentationStyle = 'personal' | 'assisted' | 'explicit_assistant';

export interface WorkingHours {
  start: string;
  end: string;
}

export interface AvailabilityPreferences {
  avoidBefore: string;
  avoidAfter: string;
  minBufferMinutes: number;
}

export interface DirectorProfile {
  displayName: string;
  preferredAddress: string;
  professionalRole: string;
  customRole?: string;
  organization?: string;
  location?: string;
  email?: string;
  phone?: string;
  timezone: string;
  preferredLanguage: 'en' | 'de';
  representationStyle: RepresentationStyle;
  defaultSignOff: string;
  workingHours: WorkingHours;
  workingDays: string[];
  defaultCalendarBufferMinutes: number;
  avatar?: string;
  availability: AvailabilityPreferences;
}
