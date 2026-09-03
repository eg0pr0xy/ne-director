import React, { useEffect } from 'react';
import { useApp } from '../store/AppStore';
import { X, CheckCircle2, Clock, Calendar, User, FolderKanban, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../utils/cn';

export const ContextDrawer = () => {
  const { isDrawerOpen, selectedItem, closeDrawer, approveDecision, getPerson, getProject } = useApp();

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  const person = selectedItem?.personId ? getPerson(selectedItem.personId) : null;
  const project = selectedItem?.projectId ? getProject(selectedItem.projectId) : null;

  return (
    <AnimatePresence>
      {isDrawerOpen && selectedItem && (
        <>
          {/* Backdrop */}
          <motion.div 
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-overlay backdrop-blur-[2px] z-[60]"
            onClick={closeDrawer}
          />
          
          {/* Drawer */}
          <motion.div 
            key="drawer-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 350 }}
            className="fixed top-0 right-0 h-full w-full max-w-[480px] bg-surface border-l border-border z-[70] shadow-2xl flex flex-col overflow-hidden text-text-primary"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-surface shrink-0">
              <div className="flex items-center gap-3.5 min-w-0">
                {selectedItem.thumbnailUrl ? (
                  <img 
                    src={selectedItem.thumbnailUrl} 
                    alt="" 
                    className="w-11 h-11 rounded-lg object-cover bg-border shrink-0" 
                  />
                ) : (
                  <div className="w-11 h-11 rounded-lg bg-surface-hover border border-border flex items-center justify-center text-text-secondary shrink-0">
                    <ShieldCheck className="w-5 h-5 text-text-muted" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold tracking-widest text-text-muted uppercase px-1.5 py-0.5 rounded bg-border">
                      {selectedItem.type}
                    </span>
                    {selectedItem.deadline && (
                      <span className="text-xs font-semibold text-[#E56A54] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {selectedItem.deadline}
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-semibold text-text-primary tracking-wide uppercase truncate">
                    {selectedItem.title}
                  </h2>
                </div>
              </div>
              <button 
                onClick={closeDrawer}
                className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-full hover:bg-border shrink-0 ml-2"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metadata bar */}
            {(person || project || selectedItem.source) && (
              <div className="px-6 py-2.5 bg-surface-hover border-b border-border flex items-center gap-4 text-xs text-text-secondary overflow-x-auto shrink-0">
                {project && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <FolderKanban className="w-3.5 h-3.5 text-text-muted" />
                    <span>{project.name}</span>
                  </div>
                )}
                {person && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <User className="w-3.5 h-3.5 text-text-muted" />
                    <span>{person.name} ({person.role})</span>
                  </div>
                )}
                {selectedItem.source && (
                  <div className="flex items-center gap-1.5 shrink-0 ml-auto font-mono text-[10px] text-text-muted uppercase">
                    <span>SOURCE: {selectedItem.source.system}</span>
                  </div>
                )}
              </div>
            )}

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-7">
              {/* Details / Why this needs you */}
              <section className="space-y-2">
                <h3 className="text-[11px] font-bold tracking-wider text-text-muted uppercase">
                  Why this needs you
                </h3>
                <div className="p-4 rounded-xl bg-surface-hover border border-border">
                  <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                    {selectedItem.context?.details || selectedItem.subtitle}
                  </p>
                </div>
              </section>

              {/* Recommendation */}
              {selectedItem.context?.recommendation && (
                <section className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-5">
                  <h3 className="text-[11px] font-bold tracking-wider text-violet-400 mb-2 uppercase flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                    Chief of Staff Recommendation
                  </h3>
                  <p className="text-sm font-medium text-text-primary mb-4 leading-relaxed">
                    {selectedItem.context.recommendation}
                  </p>
                  
                  {selectedItem.context.why && selectedItem.context.why.length > 0 && (
                    <div className="space-y-2.5 pt-3 border-t border-violet-500/15">
                      <h4 className="text-[11px] font-bold tracking-wider text-text-muted uppercase">
                        Key Factors
                      </h4>
                      <ul className="space-y-2">
                        {selectedItem.context.why.map((reason, i) => (
                          <li key={i} className="text-xs text-text-secondary flex items-start gap-2 leading-relaxed">
                            <span className="text-violet-400 font-bold mt-0.5">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              )}

              {/* Sources & Evidence */}
              <section className="space-y-3">
                <h3 className="text-[11px] font-bold tracking-wider text-text-muted uppercase">
                  Sources & Evidence
                </h3>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-hover">
                    <div className="flex items-center gap-3">
                      <div className="text-[10px] font-bold tracking-widest text-text-primary bg-border px-2 py-0.5 rounded font-mono">
                        ORDO
                      </div>
                      <span className="text-xs text-text-primary">Production timeline & schedule dependency</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-hover">
                    <div className="flex items-center gap-3">
                      <div className="text-[10px] font-bold tracking-widest text-text-primary bg-border px-2 py-0.5 rounded font-mono">
                        NARRATE
                      </div>
                      <span className="text-xs text-text-primary">Moodboard / references & creative brief</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-hover">
                    <div className="flex items-center gap-3">
                      <div className="text-[10px] font-bold tracking-widest text-text-primary bg-border px-2 py-0.5 rounded font-mono">
                        COMM
                      </div>
                      <span className="text-xs text-text-primary">Producer thread & direct inquiry</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 border-t border-border bg-surface shrink-0">
              {selectedItem.status === 'resolved' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-green-500 py-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Decision resolved & relayed to team
                  </div>
                  <button 
                    onClick={closeDrawer}
                    className="w-full py-3 px-4 rounded-xl text-sm font-medium text-text-primary bg-border hover:bg-border-hover transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs text-text-muted text-center">
                    Chief of Staff will record your decision and inform the team.
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={closeDrawer}
                      className="py-3 px-4 rounded-xl text-sm font-medium text-text-primary bg-border hover:bg-border-hover transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => approveDecision(selectedItem.id, selectedItem.title)}
                      className="py-3 px-4 rounded-xl text-sm font-medium text-text-inverted bg-bg-inverted hover:bg-bg-inverted-hover transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
