import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useApp } from '../store/AppStore';

export const SearchPage = () => {
  const [query, setQuery] = useState('');
  const { setCurrentPage, projects, people, attentionItems, allTimeline } = useApp();

  const normalizedQuery = query.toLowerCase().trim();

  const matchedProjects = normalizedQuery ? projects.filter(p => 
    p.name.toLowerCase().includes(normalizedQuery) || 
    p.type.toLowerCase().includes(normalizedQuery) ||
    p.status.toLowerCase().includes(normalizedQuery)
  ) : [];

  const matchedPeople = normalizedQuery ? people.filter(p => 
    p.name.toLowerCase().includes(normalizedQuery) || 
    p.role.toLowerCase().includes(normalizedQuery) ||
    (p.nextInteraction && p.nextInteraction.toLowerCase().includes(normalizedQuery))
  ) : [];

  const matchedAttention = normalizedQuery ? attentionItems.filter(a => 
    a.title.toLowerCase().includes(normalizedQuery) || 
    a.subtitle.toLowerCase().includes(normalizedQuery)
  ) : [];

  const matchedTimeline = normalizedQuery ? allTimeline.filter(t => 
    t.description.toLowerCase().includes(normalizedQuery) || 
    t.source.toLowerCase().includes(normalizedQuery)
  ) : [];

  const hasResults = matchedProjects.length > 0 || matchedPeople.length > 0 || matchedAttention.length > 0 || matchedTimeline.length > 0;

  return (
    <div className="px-8 py-10 max-w-[800px] mx-auto pb-32">
      <header className="mb-10">
        <h1 className="text-[28px] font-semibold tracking-tight text-text-primary uppercase mb-6">
          UNIVERSAL SEARCH
        </h1>
        <div className="relative">
           <Search className="w-5 h-5 text-text-muted absolute left-4 top-1/2 -translate-y-1/2" />
           <input 
             type="text" 
             value={query}
             onChange={e => setQuery(e.target.value)}
             placeholder="Search projects, people, decisions, timeline..." 
             className="w-full bg-surface-hover border border-border-hover text-text-primary text-base rounded-xl pl-12 pr-4 py-4 outline-none focus:border-border-focus transition-colors shadow-2xl"
             autoFocus
           />
        </div>
      </header>
      
      {!normalizedQuery ? (
         <div className="text-center py-20 text-text-muted">
           Start typing to search across the entire operating picture.
         </div>
      ) : hasResults ? (
         <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {matchedAttention.length > 0 && (
              <div>
                <h3 className="text-[11px] font-bold text-text-muted tracking-widest uppercase mb-4">Attention</h3>
                <div className="space-y-3">
                  {matchedAttention.map(item => (
                    <div 
                      key={item.id}
                      className="bg-surface border border-border hover:border-border-hover rounded-xl p-4 cursor-pointer flex justify-between items-center"
                      onClick={() => setCurrentPage('ATTENTION')}
                    >
                      <div>
                        <div className="text-sm font-medium text-text-primary mb-1 uppercase">{item.title}</div>
                        <div className="text-xs text-text-secondary max-w-xl truncate">{item.subtitle.replace('\n', ' ')}</div>
                      </div>
                      <div className="text-[10px] bg-border text-text-secondary px-2 py-1 rounded uppercase tracking-wider">{item.status.replace('_', ' ')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {matchedProjects.length > 0 && (
              <div>
                <h3 className="text-[11px] font-bold text-text-muted tracking-widest uppercase mb-4">Projects</h3>
                <div className="space-y-3">
                  {matchedProjects.map(project => (
                    <div 
                      key={project.id}
                      className="bg-surface border border-border hover:border-border-hover rounded-xl p-4 cursor-pointer"
                      onClick={() => setCurrentPage('PROJECTS')}
                    >
                      <div className="text-sm font-medium text-text-primary mb-1 uppercase">{project.name}</div>
                      <div className="text-xs text-text-secondary">{project.type} • {project.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {matchedPeople.length > 0 && (
              <div>
                <h3 className="text-[11px] font-bold text-text-muted tracking-widest uppercase mb-4">People</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matchedPeople.map(person => (
                    <div 
                      key={person.id}
                      className="bg-surface border border-border hover:border-border-hover rounded-xl p-4 cursor-pointer flex items-center gap-3"
                      onClick={() => setCurrentPage('PEOPLE')}
                    >
                      {person.avatarUrl ? (
                        <img src={person.avatarUrl} className="w-8 h-8 rounded-full bg-border object-cover" alt="" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-xs text-text-muted font-medium">
                          {person.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-text-primary">{person.name}</div>
                        <div className="text-xs text-text-secondary">{person.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {matchedTimeline.length > 0 && (
              <div>
                <h3 className="text-[11px] font-bold text-text-muted tracking-widest uppercase mb-4">Timeline</h3>
                <div className="space-y-3">
                  {matchedTimeline.map(event => (
                    <div 
                      key={event.id}
                      className="bg-surface border border-border hover:border-border-hover rounded-xl p-4 cursor-pointer flex items-center gap-4"
                      onClick={() => setCurrentPage('TIMELINE')}
                    >
                      <div className="text-xs text-text-muted w-12 shrink-0">{event.time}</div>
                      <div>
                        <div className="text-sm font-medium text-text-primary">{event.description.split('\n')[0]}</div>
                        <div className="text-xs text-text-secondary mt-1 uppercase tracking-widest">{event.source.replace('_', ' ')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
         </div>
      ) : (
         <div className="text-center py-20 text-text-muted">
           No matching records for "{query}". Try searching for "Location B" or "Harbour".
         </div>
      )}
    </div>
  );
};
