import React from 'react';
import { useApp } from '../../store/AppStore';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export const LiveTimelineModule = () => {
  const { todayState } = useApp();

  if (!todayState) return null;

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col flex-1">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold tracking-wider text-text-primary uppercase">Timeline</h3>
          <span className="text-[10px] font-medium tracking-wide text-green-500 bg-green-500/10 px-2 py-0.5 rounded uppercase">Live</span>
        </div>
      </div>

      <div className="flex-1 relative">
        <div className="space-y-4">
          {todayState.timeline.map((event, index) => {
            const isLatest = index === todayState.timeline.length - 1;
            
            return (
              <div key={event.id} className="relative flex gap-5 group items-start">
                {/* Connecting Line */}
                {!isLatest && (
                  <div className="absolute left-[54px] top-4 bottom-[-16px] w-[1px] bg-border-hover" />
                )}

                <span className={cn(
                  "text-sm shrink-0 w-[42px] text-right",
                  event.isHumanDecision ? "text-green-500 font-medium" : "text-text-secondary"
                )}>
                  {event.time}
                </span>

                <div className="w-4 shrink-0 flex justify-center mt-1.5 relative z-10">
                  <div className={cn(
                    "w-[5px] h-[5px] rounded-full ring-4 ring-surface",
                    event.isHumanDecision 
                      ? "bg-green-500" 
                      : "bg-transparent border border-gray-400"
                  )} />
                </div>
                
                <span className={cn(
                  "text-sm leading-snug mt-0.5",
                  event.isHumanDecision ? "text-green-500 font-medium" : "text-text-primary"
                )}>
                  {event.description}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <button className="w-full py-4 text-xs font-medium text-text-muted hover:text-text-primary flex items-center justify-center gap-1 mt-6">
        View full timeline <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
};
