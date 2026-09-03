import { AttentionItem, CalendarEvent, HandledAction, OpenLoop, OperationalInsight, Person, Project, TimelineEvent, TodayState } from '../types';
import { mockAttentionItems, mockCalendar, mockHandled, mockInsights, mockPeople, mockProjects, mockTimeline, mockWaitingFor } from '../mocks/data';

export interface ChiefOfStaffService {
  getToday(): Promise<TodayState>;
  getAttention(): Promise<AttentionItem[]>;
  getProjects(): Promise<Project[]>;
  getPeople(): Promise<Person[]>;
  getTimeline(): Promise<TimelineEvent[]>;
}

export class MockChiefOfStaffService implements ChiefOfStaffService {
  async getToday(): Promise<TodayState> {
    return {
      needsYou: [...mockAttentionItems],
      calendar: [...mockCalendar],
      waitingFor: [...mockWaitingFor],
      handled: [...mockHandled],
      insights: [...mockInsights],
      timeline: [...mockTimeline]
    };
  }

  async getAttention(): Promise<AttentionItem[]> {
    return [...mockAttentionItems];
  }

  async getProjects(): Promise<Project[]> {
    return [...mockProjects];
  }

  async getPeople(): Promise<Person[]> {
    return [...mockPeople];
  }

  async getTimeline(): Promise<TimelineEvent[]> {
    return [...mockTimeline];
  }
}

export const apiService = new MockChiefOfStaffService();
