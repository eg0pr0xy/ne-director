import { AttentionItem, CalendarEvent, HandledAction, OpenLoop, OperationalInsight, Person, Project, TimelineEvent, TodayState } from '../types';
import { mockAttentionItems, mockCalendar, mockHandled, mockInsights, mockPeople, mockProjects, mockTimeline, mockWaitingFor } from '../mocks/data';

export interface ChiefOfStaffService {
  getToday(): Promise<TodayState>;
  getAttention(): Promise<AttentionItem[]>;
  getProjects(): Promise<Project[]>;
  getPeople(): Promise<Person[]>;
  getTimeline(): Promise<TimelineEvent[]>;
  getOpenLoops(): Promise<OpenLoop[]>;
  recordDecision(id: string, selectedOption: 'LOCATION_A' | 'LOCATION_B'): Promise<void>;
}

export class MockChiefOfStaffService implements ChiefOfStaffService {
  async recordDecision(): Promise<void> { throw new Error('Mock mode does not provide persistent decisions.'); }
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

  async getOpenLoops(): Promise<OpenLoop[]> {
    return [...mockWaitingFor];
  }
}

export class DirectorApiService implements ChiefOfStaffService {
  constructor(private readonly baseUrl: string) {}
  private async get(path: string) { const r=await fetch(`${this.baseUrl}${path}`); if(!r.ok) throw new Error(`Director API ${r.status}`); return r.json(); }
  async getToday(): Promise<TodayState> { const [x,waitingFor]=await Promise.all([this.get('/today'),this.getOpenLoops()]); return { needsYou:x.needsYou.map((i:any)=>({id:i.id,title:i.title,subtitle:i.rationale.join(' • '),deadline:new Date(i.deadline).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),status:'needs_you',source:{system:'CHIEF_OF_STAFF'},personId:i.person?.external_id==='anna-meyer'?'u1':undefined,projectId:i.project?.external_id==='harbour'?'p1':undefined,type:'decision'})),calendar:[],waitingFor,handled:[],insights:[],timeline:[] }; }
  async getAttention(){ const x=await this.get('/attention'); return x.items.map((i:any)=>({id:i.id,title:i.title,subtitle:i.rationale.join(' • '),deadline:new Date(i.deadline).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),status:'needs_you',source:{system:'CHIEF_OF_STAFF'},personId:i.person?.external_id==='anna-meyer'?'u1':undefined,projectId:i.project?.external_id==='harbour'?'p1':undefined,type:'decision'})); }
  async getProjects(){ const x=await this.get('/projects'); const details=await Promise.all(x.items.map((p:any)=>this.get(`/projects/${p.id}`))); return details.map((p:any)=>({id:p.id==='harbour'?'p1':p.id,name:p.name,type:'Feature Film',status:'Production',needsYouCount:p.needsYouCount})); }
  async getPeople(){ const x=await this.get('/people'); const details=await Promise.all(x.items.map((p:any)=>this.get(`/people/${p.id}`))); return details.map((p:any)=>({id:p.id==='anna'?'u1':p.id,name:p.name,role:'Producer',projectId:'p1',openItemsCount:p.openItemsCount})); }
  async getTimeline(){ const x=await this.get('/timeline'); return x.items.map((e:any)=>({id:e.id,time:new Date(e.occurred_at).toLocaleTimeString(),description:e.description,source:e.source_system==='NE_DIRECTOR_CORE'?'CHIEF_OF_STAFF':'ORDO',isHumanDecision:e.event_type==='DIRECTOR_DECISION_RECORDED'})); }
  async getOpenLoops(){ const x=await this.get('/open-loops'); return x.items.map((loop:any)=>({id:loop.id,personId:loop.person_ref?.external_id==='anna-meyer'?'u1':'',task:loop.expected_result,timeRemaining:loop.expected_by?`Due ${new Date(loop.expected_by).toLocaleString()}`:'No expected date'})); }
  async recordDecision(id:string, selectedOption:'LOCATION_A'|'LOCATION_B'){ const r=await fetch(`${this.baseUrl}/decisions/${id}/record`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({selectedOption})});if(!r.ok)throw new Error(`Decision failed: ${r.status}`); }
}
const mode=import.meta.env.VITE_DIRECTOR_RUNTIME_MODE ?? 'mock';
export const apiService: ChiefOfStaffService = mode==='api' ? new DirectorApiService(import.meta.env.VITE_DIRECTOR_API_BASE_URL ?? 'http://127.0.0.1:4600/api/v1') : new MockChiefOfStaffService();
