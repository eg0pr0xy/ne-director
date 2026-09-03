import React, { useState } from 'react';
import { useApp } from '../store/AppStore';
import { ChevronRight, ChevronLeft, Calendar as CalIcon, MessageSquare, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';
import { Person } from '../types';

export const PeoplePage = () => {
  const { people, projects, attentionItems, allTimeline } = useApp();
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  const selectedPerson = selectedPersonId ? people.find(p => p.id === selectedPersonId) : null;

  if (selectedPerson) {
    return <PersonDetail person={selectedPerson} attentionItems={attentionItems} timeline={allTimeline} onBack={() => setSelectedPersonId(null)} />;
  }

  return (
    <div className="px-8 py-10 max-w-[1200px] mx-auto pb-32">
      <header className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-text-primary uppercase mb-1">
            PEOPLE
          </h1>
          <p className="text-text-secondary text-sm tracking-wide">People across your projects and professional world.</p>
        </div>
        <div className="flex gap-3">
           <input 
             type="text" 
             placeholder="Search people..." 
             className="bg-surface-hover border border-border-hover text-text-primary text-sm rounded-lg px-4 py-2 outline-none w-64"
           />
           <select className="bg-surface-hover border border-border-hover text-text-primary text-sm rounded-lg px-3 py-2 outline-none">
             <option>All</option>
             <option>Production</option>
             <option>Creative</option>
             <option>Cast</option>
             <option>Representation</option>
             <option>Partners</option>
           </select>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {people.map(person => {
          const project = projects.find(p => p.id === person.projectId);
          
          return (
            <div 
              key={person.id}
              onClick={() => setSelectedPersonId(person.id)}
              className="group bg-surface border border-border hover:border-border-hover rounded-2xl p-6 flex flex-col gap-6 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start gap-4">
                {person.avatarUrl ? (
                  <img src={person.avatarUrl} alt="" className="w-12 h-12 rounded-full bg-border object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-border flex items-center justify-center text-sm text-text-muted font-medium">
                    {person.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-base font-semibold text-text-primary tracking-wide">{person.name}</h3>
                  <div className="text-[11px] text-text-muted uppercase tracking-widest mt-1">
                    {person.role} {project && `· ${project.name}`}
                  </div>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                {(person.openItemsCount || 0) > 0 && (
                  <div>
                    <div className="text-xs text-[#E56A54] font-medium">{person.openItemsCount} open items</div>
                  </div>
                )}
                
                {person.nextInteraction && (
                  <div className="bg-border p-3 rounded-lg border border-border">
                    <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Next Interaction</div>
                    <div className="text-xs text-text-primary font-medium">{person.nextInteraction}</div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};

const PersonDetail: React.FC<{ person: Person; attentionItems: import('../types').AttentionItem[]; timeline: import('../types').TimelineEvent[]; onBack: () => void }> = ({ person, attentionItems, timeline, onBack }) => {
  const { projects } = useApp();
  const project = projects.find(p => p.id === person.projectId);
  const openItems = attentionItems.filter(item => item.personId === person.id && item.status !== 'resolved');
  const relatedTimeline = timeline.filter(event => event.description.toLowerCase().includes(person.name.toLowerCase())).slice(0, 3);

  return (
    <div className="px-8 py-10 max-w-[1000px] mx-auto pb-32">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-8 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to People
      </button>

      <header className="mb-12 flex items-center gap-6">
        {person.avatarUrl ? (
          <img src={person.avatarUrl} alt="" className="w-24 h-24 rounded-full bg-border object-cover" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-border flex items-center justify-center text-2xl text-text-muted font-medium">
            {person.name.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-[32px] font-semibold tracking-tight text-text-primary uppercase mb-1">
            {person.name}
          </h1>
          <p className="text-text-secondary text-base tracking-wide uppercase">
            {person.role} {project && `· ${project.name}`}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column */}
        <div className="space-y-8">
          <div className="bg-surface border border-border rounded-2xl p-6">
             <h3 className="text-xs font-semibold tracking-widest text-text-muted uppercase mb-4">Relationship</h3>
             <div className="space-y-4">
               <div>
                 <div className="text-sm text-text-primary">Primary Producer</div>
               </div>
               <div>
                 <div className="text-sm text-text-primary">Frequent collaborator</div>
               </div>
               <div>
                 <div className="text-[11px] text-text-muted uppercase tracking-widest mb-1">Active Project</div>
                 <div className="text-sm font-medium text-text-primary">{project?.name || 'HARBOUR'}</div>
               </div>
             </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6">
             <h3 className="text-xs font-semibold tracking-widest text-text-muted uppercase mb-4">Open with {person.name.split(' ')[0]}</h3>
             <div className="space-y-5">
               {openItems.length > 0 ? openItems.map(item => (
                 <div key={item.id}>
                   <div className="text-sm text-text-primary uppercase font-medium mb-1">{item.title}</div>
                   <div className="text-xs text-[#E56A54]">{item.deadline ? `Decision requested by ${item.deadline}` : 'Decision requested'}</div>
                 </div>
               )) : <div className="text-sm text-text-secondary">No open decisions.</div>}
             </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6">
             <h3 className="text-xs font-semibold tracking-widest text-text-muted uppercase mb-4">Waiting For</h3>
             <div>
               <div className="text-sm text-text-primary font-medium mb-1">Revised production plan</div>
               <div className="text-xs text-text-secondary">Expected tomorrow</div>
             </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          
          <div className="bg-surface-hover border border-border-hover rounded-2xl p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-border blur-3xl rounded-full" />
             <h3 className="text-xs font-semibold tracking-widest text-text-muted uppercase mb-6">Next Interaction</h3>
             
             <div className="mb-6">
               <div className="text-sm text-text-primary font-medium uppercase tracking-wide mb-1">Today</div>
               <div className="flex gap-4 items-center">
                 <div className="text-3xl font-light text-text-primary">16:30</div>
                 <div className="text-sm text-text-secondary">
                   <div>Production Meeting</div>
                   <div>Office</div>
                 </div>
               </div>
             </div>
             
             <button className="w-full py-3 bg-bg-inverted text-text-inverted text-sm font-medium rounded-xl hover:bg-bg-inverted-hover transition-colors">
               Prepare Me
             </button>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6">
             <h3 className="text-xs font-semibold tracking-widest text-text-muted uppercase mb-6">Recent Communication</h3>
             <div className="space-y-5">
               {relatedTimeline.length > 0 ? relatedTimeline.map(event => (
                 <div key={event.id} className="flex gap-4">
                   <div className="text-xs text-text-secondary shrink-0 w-20 pt-0.5">{event.time}</div>
                   <div className="text-sm text-text-primary whitespace-pre-wrap">{event.description}</div>
                 </div>
               )) : <div className="text-sm text-text-secondary">No recorded communication.</div>}
             </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6">
             <h3 className="text-xs font-semibold tracking-widest text-text-muted uppercase mb-4">Recent Decisions</h3>
             <div className="space-y-3 text-sm text-text-primary">
               <div>Hotel approved</div>
               <div>Night shoot moved</div>
               <div>Casting session extended</div>
             </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};
