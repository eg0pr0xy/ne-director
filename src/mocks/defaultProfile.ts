import { DirectorProfile } from '../types/profile';

export const defaultProfile: DirectorProfile = {
  displayName: 'Marcus',
  preferredAddress: 'Marcus',
  professionalRole: 'Director',
  customRole: '',
  organization: 'Neue Episteme',
  location: 'Berlin',
  email: 'marcus@neue-episteme.com',
  phone: '+49 30 8920 4410',
  timezone: 'Europe / Berlin',
  preferredLanguage: 'en',
  representationStyle: 'assisted',
  defaultSignOff: 'Best,\nMarcus',
  workingHours: {
    start: '09:00',
    end: '19:00',
  },
  workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  defaultCalendarBufferMinutes: 30,
  avatar: 'https://i.pravatar.cc/150?u=marcus',
  availability: {
    avoidBefore: '09:00',
    avoidAfter: '19:00',
    minBufferMinutes: 15,
  },
};

export const MOCK_AVATAR_PRESETS = [
  {
    id: 'preset-marcus-1',
    label: 'Marcus (Default)',
    url: 'https://i.pravatar.cc/150?u=marcus'
  },
  {
    id: 'preset-director-2',
    label: 'Editorial Portrait',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&auto=format&fit=crop&q=80'
  },
  {
    id: 'preset-director-3',
    label: 'Monochrome Film',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&auto=format&fit=crop&q=80'
  },
  {
    id: 'preset-director-4',
    label: 'Studio Directing',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&auto=format&fit=crop&q=80'
  }
];
