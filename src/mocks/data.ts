import { AttentionItem, CalendarEvent, HandledAction, OpenLoop, OperationalInsight, Person, Project, TimelineEvent } from '../types';

export const mockProjects: Project[] = [
  { id: 'p1', name: 'HARBOUR', type: 'Feature Film', status: 'Production', shootDay: 'Day 12 / 36', productionStatus: 'Mostly Ready', needsYouCount: 3, risks: 1 },
  { id: 'p2', name: 'BLUE GUY', type: 'Series', status: 'Development', productionStatus: 'Script Revision 8', openDecisions: 4, nextEvent: 'Development Session Friday 10:00' },
  { id: 'p3', name: 'ATLAS', type: 'Branded Entertainment', status: 'Pre-Production', shootStarts: '12 days', productionStatus: 'At Risk', openDecisions: 2 },
];

export const mockPeople: Person[] = [
  { id: 'u1', name: 'Anna Meyer', role: 'Producer', projectId: 'p1', openItemsCount: 2, nextInteraction: 'Thursday 11:00', relationship: 'Primary Producer, Frequent collaborator', avatarUrl: 'https://i.pravatar.cc/150?u=anna' },
  { id: 'u2', name: 'Lukas Kern', role: 'DP', projectId: 'p1', avatarUrl: 'https://i.pravatar.cc/150?u=lukas' },
  { id: 'u3', name: 'Mila Hartmann', role: 'Casting', projectId: 'p1', avatarUrl: 'https://i.pravatar.cc/150?u=mila' },
  { id: 'u4', name: 'Jonas Weber', role: 'Production Design', projectId: 'p1', avatarUrl: 'https://i.pravatar.cc/150?u=jonas' },
  { id: 'u5', name: 'Lea Hoffmann', role: 'Actor', projectId: 'p1', avatarUrl: 'https://i.pravatar.cc/150?u=lea' },
];

export const mockAttentionItems: AttentionItem[] = [
  {
    id: 'a1',
    title: 'LOCATION B',
    subtitle: 'Production Design cannot proceed until Location B is approved.',
    deadline: '14:00',
    remainingTime: '1h remaining',
    status: 'needs_you',
    source: { system: 'ORDO' },
    personId: 'u1',
    projectId: 'p1',
    type: 'decision',
    thumbnailUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=300&h=200',
    context: {
      recommendation: 'Choose B',
      why: [
        '€4,200 cheaper',
        'Better natural-light conditions',
        'No shooting-schedule impact',
        'Production Design prefers B'
      ],
      details: 'Production Design has 6 downstream tasks blocked by this decision.'
    }
  },
  {
    id: 'a2',
    title: 'CASTING — LEA',
    subtitle: 'Callback decision\nCasting needs confirmation whether Lea should return for a second session.',
    deadline: '17:00',
    remainingTime: '3h remaining',
    status: 'needs_you',
    source: { system: 'NARRATE' },
    personId: 'u3',
    projectId: 'p1',
    type: 'decision',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300&h=200',
    context: {
      recommendation: 'Confirm Callback Session for Tomorrow',
      why: [
        'Top score in initial audition chemistry evaluation',
        'Director of Photography confirms screen test lighting profile match',
        'Agency confirmed exclusive hold through end of week'
      ],
      details: 'Casting Director Elena needs approval by 17:00 to block studio space and notify representation for tomorrow 11:00 AM.'
    }
  },
  {
    id: 'a3',
    title: 'SCRIPT REVISION V27',
    subtitle: '4 changes require director review.\nScenes affected: 42, 46, 51, 73',
    remainingTime: '4h remaining',
    status: 'needs_you',
    source: { system: 'NARRATE' },
    projectId: 'p1',
    type: 'review',
    context: {
      recommendation: 'Approve revisions to Scenes 42, 46, and 73; hold Scene 51',
      why: [
        'Dialogue cuts reduce sequence runtime by 3.5 minutes',
        'Simplified night exterior lighting setup on set for Scene 46',
        'VFX continuity match verified between Scene 42 and 73'
      ],
      details: 'Script Supervisor logged 4 line and action adjustments based on yesterday night shoot notes. Scene 51 contains alternate blocking that can be reviewed with actors on set.'
    }
  },
  // Delegated
  {
    id: 'a4',
    title: 'Hotel change for Munich',
    subtitle: 'Assigned to Chief of Staff\nIn progress',
    status: 'delegated',
    source: { system: 'CHIEF_OF_STAFF' },
    projectId: 'p1',
    type: 'fyi'
  },
  {
    id: 'a5',
    title: 'Festival accreditation follow-up',
    subtitle: 'Assigned to Assistant\nWaiting for reply',
    status: 'delegated',
    source: { system: 'COMMUNICATION' },
    type: 'fyi'
  },
  // FYI
  {
    id: 'a6',
    title: 'Festival accreditation confirmed',
    subtitle: 'Received 10 mins ago',
    status: 'fyi',
    source: { system: 'COMMUNICATION' },
    type: 'fyi'
  },
  {
    id: 'a7',
    title: 'New treatment uploaded',
    subtitle: 'Blue Guy project',
    status: 'fyi',
    source: { system: 'NARRATE' },
    projectId: 'p2',
    type: 'fyi'
  },
  {
    id: 'a8',
    title: 'Updated production insurance document',
    subtitle: 'Harbour project',
    status: 'fyi',
    source: { system: 'ORDO' },
    projectId: 'p1',
    type: 'fyi'
  },
  {
    id: 'a9',
    title: 'Screening room changed to Kino Babylon 2',
    subtitle: 'Tonight at 19:00',
    status: 'fyi',
    source: { system: 'CALENDAR' },
    projectId: 'p1',
    type: 'fyi'
  },
  // Resolved
  {
    id: 'a10',
    title: 'Location A rejected',
    subtitle: 'Resolved yesterday\nDecision: Proceed with Location B shortlist',
    status: 'resolved',
    source: { system: 'CHIEF_OF_STAFF' },
    projectId: 'p1',
    type: 'fyi'
  }
];

export const mockCalendar: CalendarEvent[] = [
  { id: 'c1', time: '09:30', title: 'Team Stand-up', location: 'Online', type: 'meeting' },
  { id: 'c2', time: '12:30', title: 'Lunch', location: 'With Producer', type: 'personal' },
  { id: 'c3', time: '14:00', title: 'Casting', location: 'Studio A', type: 'shoot' },
  { id: 'c4', time: '16:30', title: 'Production Meeting', location: 'Office', type: 'meeting' },
  { id: 'c5', time: '19:00', title: 'Screening', location: 'Rough Cut • Kino Babylon', type: 'review' },
];

export const mockWaitingFor: OpenLoop[] = [
  { id: 'w1', personId: 'u2', task: 'Lens List', timeRemaining: '19h' },
  { id: 'w2', personId: 'u1', task: 'Budget Confirmation', timeRemaining: '1d' },
  { id: 'w3', personId: 'u3', task: 'Callback Decision', timeRemaining: '2h' },
  { id: 'w4', personId: 'u4', task: 'Location Photos B', timeRemaining: '5h' },
];

export const mockHandled: HandledAction[] = [
  { id: 'h1', description: 'Driver confirmed', time: '08:15' },
  { id: 'h2', description: 'Agency meeting moved', time: 'Yesterday' },
  { id: 'h3', description: 'Script v27 distributed', time: 'Yesterday' },
  { id: 'h4', description: 'Hotel booking for crew', time: 'Yesterday' },
];

export const mockInsights: OperationalInsight[] = [
  { id: 'i1', description: 'Location B is €4,200 cheaper and has better lighting conditions.', type: 'financial' },
  { id: 'i2', description: 'Shooting schedule remains unchanged.', type: 'schedule' },
  { id: 'i3', description: 'Production Design is ready if the decision arrives before 14:00.', type: 'logistical' },
];

export const mockTimeline: TimelineEvent[] = [
  { id: 't1', time: '09:42', description: 'Producer asked for Location decision', source: 'COMMUNICATION' },
  { id: 't2', time: '09:44', description: 'Chief of Staff detected blocker', source: 'CHIEF_OF_STAFF' },
  { id: 't3', time: '09:45', description: 'ORDO requirement attached', source: 'ORDO' },
  { id: 't4', time: '09:46', description: 'NARRATE moodboard linked', source: 'NARRATE' },
];
