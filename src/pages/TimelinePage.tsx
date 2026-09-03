import React from 'react';
import { useApp } from '../store/AppStore';
import { Search } from 'lucide-react';
import { TimelineEvent } from '../types';

export const TimelinePage = () => {
  const { allTimeline } = useApp();

  // Group events by a date. Since we don't have real dates on these mock events (just times like '09:42' or 'Yesterday'), 
  // we will group them heuristically for the prototype.
  const todayEvents = allTimeline.filter(e => e.time.includes(':')).reverse();

  return (
    <div className="px-8 py-10 max-w-[1000px] mx-auto pb-32">
      <header className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-text-primary uppercase mb-1">
            TIMELINE
          </h1>
          <p className="text-text-secondary text-sm tracking-wide">What happened, what the Chief of Staff did, and why.</p>
        </div>
        
        <div className="flex gap-3">
           <div className="relative">
             <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
             <input 
               type="text" 
               placeholder="Search timeline..." 
               className="bg-surface-hover border border-border-hover text-text-primary text-sm rounded-lg pl-9 pr-4 py-2 outline-none w-64 focus:border-border-focus transition-colors"
             />
           </div>
           <select className="bg-surface-hover border border-border-hover text-text-primary text-sm rounded-lg px-3 py-2 outline-none">
             <option>Everything</option>
             <option>Me</option>
             <option>Chief of Staff</option>
             <option>ORDO</option>
             <option>NARRATE</option>
             <option>Communication</option>
             <option>Calendar</option>
           </select>
        </div>
      </header>

      <div className="relative pl-8 before:absolute before:left-[39px] before:top-4 before:bottom-0 before:w-px before:bg-border space-y-12">
        
        <div>
          <div className="flex items-center gap-4 mb-8 relative -left-8">
             <div className="w-10 h-10 rounded-full bg-surface border border-border-hover flex items-center justify-center shrink-0 z-10 text-[10px] font-bold text-text-secondary uppercase">
               TDY
             </div>
             <h2 className="text-sm font-semibold tracking-widest text-text-primary uppercase">Today</h2>
          </div>

          <div className="space-y-6">
             {todayEvents.map(event => (
               <div key={event.id} className="relative">
                 <div className="absolute -left-10 w-4 h-4 rounded-full bg-surface border border-border-hover mt-1 z-10 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-bg-inverted/30" />
                 </div>
                 
                 <div className="bg-surface border border-border rounded-2xl p-6">
                    <div className="flex items-start justify-between mb-2">
                       <div className="flex items-center gap-3">
                         <span className="text-xs text-text-muted">{event.time}</span>
                         <span className="text-[10px] font-bold tracking-widest text-text-secondary uppercase bg-border px-2 py-0.5 rounded">
                           {event.isHumanDecision ? 'YOU' : event.source.replace('_', ' ')}
                         </span>
                       </div>
                       <span className="text-[10px] text-text-muted uppercase tracking-widest">Harbour</span>
                    </div>
                    
                    <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                      {event.description}
                    </p>
                 </div>
               </div>
             ))}
          </div>
        </div>

      </div>
    </div>
  );
};
