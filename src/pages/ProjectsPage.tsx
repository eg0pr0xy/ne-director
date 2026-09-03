import React, { useState } from 'react';
import { useApp } from '../store/AppStore';
import { ChevronRight, ChevronLeft, Calendar as CalIcon, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';
import { Project } from '../types';

export const ProjectsPage = () => {
  const { projects, attentionItems, allTimeline } = useApp();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;

  if (selectedProject) {
    return <ProjectDetail project={selectedProject} attentionItems={attentionItems} timeline={allTimeline} onBack={() => setSelectedProjectId(null)} />;
  }

  return (
    <div className="px-8 py-10 max-w-[1200px] mx-auto pb-32">
      <header className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-text-primary uppercase mb-1">
            PROJECTS
          </h1>
          <p className="text-text-secondary text-sm tracking-wide">Your active creative and production work.</p>
        </div>
        <div className="flex gap-2">
           <select className="bg-surface-hover border border-border-hover text-text-primary text-sm rounded-lg px-3 py-2 outline-none">
             <option>All</option>
             <option>Development</option>
             <option>Pre-Production</option>
             <option>Production</option>
             <option>Post</option>
             <option>Completed</option>
           </select>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <div 
            key={project.id}
            onClick={() => setSelectedProjectId(project.id)}
            className="group bg-surface border border-border hover:border-border-hover rounded-2xl p-6 flex flex-col gap-6 transition-all duration-300 cursor-pointer overflow-hidden relative"
          >
            {/* Subtle BG styling for harbour */}
            {project.name === 'HARBOUR' && (
              <div className="absolute top-0 right-0 left-0 h-32 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />
            )}

            <div>
              <div className="text-[11px] font-bold tracking-widest text-text-muted uppercase mb-2">
                {project.type} · {project.status}
              </div>
              <h2 className="text-xl font-semibold text-text-primary tracking-wide uppercase">
                {project.name}
              </h2>
            </div>

            <div className="space-y-4 flex-1">
              {project.shootDay && (
                <div>
                  <div className="text-xs text-text-muted mb-0.5">Shoot</div>
                  <div className="text-sm text-text-primary">{project.shootDay}</div>
                </div>
              )}
              {project.shootStarts && (
                <div>
                  <div className="text-xs text-text-muted mb-0.5">Shoot starts</div>
                  <div className="text-sm text-text-primary">{project.shootStarts}</div>
                </div>
              )}
              {project.productionStatus && (
                <div>
                  <div className="text-xs text-text-muted mb-0.5">{project.status === 'Development' ? 'Script' : 'Production'}</div>
                  <div className={cn("text-sm font-medium", project.productionStatus === 'At Risk' ? "text-[#E56A54]" : "text-text-primary")}>
                    {project.productionStatus}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
               <div className="flex gap-4">
                 {(project.needsYouCount || project.openDecisions) ? (
                   <div className="flex flex-col">
                     <span className="text-xs text-text-muted">Needs You</span>
                     <span className="text-sm font-semibold text-text-primary">{project.needsYouCount || project.openDecisions}</span>
                   </div>
                 ) : null}
                 {project.risks ? (
                   <div className="flex flex-col">
                     <span className="text-xs text-text-muted">Risks</span>
                     <span className="text-sm font-semibold text-[#E56A54]">{project.risks}</span>
                   </div>
                 ) : null}
               </div>
               <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center group-hover:bg-border-hover transition-colors">
                 <ChevronRight className="w-4 h-4 text-text-secondary" />
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProjectDetail: React.FC<{ project: Project; attentionItems: import('../types').AttentionItem[]; timeline: import('../types').TimelineEvent[]; onBack: () => void }> = ({ project, attentionItems, timeline, onBack }) => {
  const openDecisions = attentionItems.filter(item => item.projectId === project.id && item.status === 'needs_you');
  const recentChanges = timeline.slice(0, 4);
  return (
    <div className="px-8 py-10 max-w-[1400px] mx-auto pb-32">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-8 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Projects
      </button>

      <header className="mb-10 flex items-end justify-between">
        <div>
          <h1 className="text-[32px] font-semibold tracking-tight text-text-primary uppercase mb-2">
            {project.name}
          </h1>
          <p className="text-text-secondary text-sm tracking-wide uppercase">
            {project.type} · {project.status}
          </p>
        </div>
        <div className="flex gap-2">
           <span className="text-[10px] font-bold tracking-widest text-text-muted bg-border px-2 py-1 rounded uppercase">NARRATE</span>
           <span className="text-[10px] font-bold tracking-widest text-text-muted bg-border px-2 py-1 rounded uppercase">ORDO</span>
           <span className="text-[10px] font-bold tracking-widest text-text-muted bg-border px-2 py-1 rounded uppercase">PRESENCE</span>
           <span className="text-[10px] font-bold tracking-widest text-text-muted bg-border px-2 py-1 rounded uppercase">MNEME</span>
        </div>
      </header>

      {/* Status Strip */}
      <div className="flex bg-surface border border-border rounded-xl p-6 mb-8 gap-12 overflow-x-auto hide-scrollbar">
         <div>
           <div className="text-xs text-text-muted uppercase tracking-widest mb-1">Shoot</div>
           <div className="text-sm font-medium text-text-primary">{project.shootDay || 'Not started'}</div>
         </div>
         <div>
           <div className="text-xs text-text-muted uppercase tracking-widest mb-1">Production</div>
           <div className="text-sm font-medium text-text-primary">{project.productionStatus || 'On Track'}</div>
         </div>
         <div>
           <div className="text-xs text-text-muted uppercase tracking-widest mb-1">Cast</div>
           <div className="text-sm font-medium text-text-primary">Ready</div>
         </div>
         <div>
           <div className="text-xs text-text-muted uppercase tracking-widest mb-1">Script</div>
           <div className="text-sm font-medium text-text-primary">v27</div>
         </div>
         <div>
           <div className="text-xs text-text-muted uppercase tracking-widest mb-1">Creative</div>
              <div className="text-sm font-medium text-text-primary">{openDecisions.length} Open Decisions</div>
         </div>
         <div>
           <div className="text-xs text-text-muted uppercase tracking-widest mb-1">Risks</div>
           <div className="text-sm font-medium text-[#E56A54]">1 Active</div>
         </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 xl:col-span-8 flex flex-col gap-8">
          
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h3 className="text-sm font-semibold tracking-wider text-text-primary uppercase mb-6">Needs You</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {openDecisions.length > 0 ? openDecisions.map((item, index) => (
                <div key={item.id} className="bg-surface-hover p-5 rounded-xl border border-border">
                   <div className="text-[10px] text-text-muted font-bold mb-2">{String(index + 1).padStart(2, '0')}</div>
                   <div className="text-sm text-text-primary font-medium mb-1 uppercase">{item.title}</div>
                   <div className="text-xs text-[#E56A54]">{item.deadline ? `Due ${item.deadline}` : item.remainingTime || 'Review required'}</div>
                </div>
              )) : <div className="text-sm text-text-secondary md:col-span-3">No decisions currently require you.</div>}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6">
             <h3 className="text-sm font-semibold tracking-wider text-text-primary uppercase mb-6">Next 72 Hours</h3>
             <div className="space-y-8">
               <div>
                 <div className="text-[11px] font-bold text-text-muted tracking-widest uppercase mb-4">Today</div>
                 <div className="space-y-4">
                   <div className="flex gap-4">
                     <div className="text-sm text-text-secondary w-12 shrink-0">16:30</div>
                     <div><div className="text-sm text-text-primary">Production Meeting</div></div>
                   </div>
                   <div className="flex gap-4">
                     <div className="text-sm text-text-secondary w-12 shrink-0">19:00</div>
                     <div><div className="text-sm text-text-primary">Rough Cut Screening</div></div>
                   </div>
                 </div>
               </div>
               
               <div>
                 <div className="text-[11px] font-bold text-text-muted tracking-widest uppercase mb-4">Tomorrow</div>
                 <div className="space-y-4">
                   <div className="flex gap-4 items-start">
                     <div className="text-sm text-text-secondary w-12 shrink-0">06:30</div>
                     <div>
                       <div className="text-sm text-text-primary mb-2">Call</div>
                       <div className="space-y-3 pl-4 border-l border-border-hover">
                         <div>
                           <div className="text-xs text-text-secondary uppercase tracking-wider">Scene 41</div>
                           <div className="text-sm text-text-primary font-medium">INT. APARTMENT – MORNING</div>
                         </div>
                         <div>
                           <div className="text-xs text-text-secondary uppercase tracking-wider">Scene 42</div>
                           <div className="text-sm text-text-primary font-medium">EXT. STREET – DAY</div>
                         </div>
                         <div>
                           <div className="text-xs text-text-secondary uppercase tracking-wider">Scene 46</div>
                           <div className="text-sm text-text-primary font-medium">INT. OFFICE – DAY</div>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
               
               <div>
                 <div className="text-[11px] font-bold text-text-muted tracking-widest uppercase mb-4">Friday</div>
                 <div className="space-y-4">
                   <div className="flex gap-4">
                     <div className="text-sm text-text-secondary w-12 shrink-0"><CalIcon className="w-4 h-4"/></div>
                     <div>
                       <div className="text-sm text-text-primary">Tech Scout</div>
                       <div className="text-xs text-text-muted mt-1">Location B</div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4 flex flex-col gap-8">
          
          <div className="bg-surface-hover border border-[#E56A54]/20 rounded-2xl p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-[#E56A54]/10 blur-2xl rounded-full" />
             <div className="flex items-center gap-2 mb-4 text-[#E56A54]">
               <AlertTriangle className="w-5 h-5" />
               <h3 className="text-sm font-semibold tracking-wider uppercase">Active Risks</h3>
             </div>
             
             <div className="mt-4">
               <h4 className="text-base text-text-primary font-medium uppercase mb-1">Prop Vehicle</h4>
               <div className="text-[11px] text-[#E56A54] font-bold tracking-widest uppercase mb-4">Status: Blocked</div>
               
               <div className="space-y-3 text-sm text-text-primary mb-6">
                 <div className="flex justify-between">
                   <span className="text-text-muted">Required for</span>
                   <span>Scene 46</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-text-muted">Owner</span>
                   <span>Production</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-text-muted">Expected</span>
                   <span>Today 16:00</span>
                 </div>
               </div>
               
               <div className="text-xs text-text-muted pt-4 border-t border-border-hover">
                 No director action required.
               </div>
             </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6">
             <h3 className="text-sm font-semibold tracking-wider text-text-primary uppercase mb-6">Recent Changes</h3>
             <div className="space-y-5">
               {recentChanges.map(event => (
                 <div key={event.id} className="flex gap-4">
                   <div className="text-sm text-text-secondary shrink-0 w-16">{event.time}</div>
                   <div className="text-sm text-text-primary whitespace-pre-wrap">{event.description}</div>
                 </div>
               ))}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};
