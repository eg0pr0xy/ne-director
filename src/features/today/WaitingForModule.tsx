import React from 'react';
import { useApp } from '../../store/AppStore';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export const WaitingForModule = () => {
  const { todayState, getPerson } = useApp();

  if (!todayState) return null;

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-sm font-semibold tracking-wider text-text-primary uppercase">Waiting For</h3>
      </div>

      <div className="flex-1 space-y-6">
        {todayState.waitingFor.map(item => {
          const person = getPerson(item.personId);
          if (!person) return null;

          const isHours = item.timeRemaining.includes('h');
          const timeColor = isHours ? 'text-amber-500' : 'text-amber-600';

          return (
            <div key={item.id} className="flex items-center gap-4">
              <img src={person.avatarUrl} alt="" className="w-10 h-10 rounded-full bg-border-hover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-text-primary">{person.role}</span>
                  <span className="text-text-muted text-xs">•</span>
                  <span className="text-sm text-text-secondary">{person.name.split(' ')[0]}</span>
                </div>
                <div className="text-[13px] text-text-secondary truncate mt-0.5">{item.task}</div>
              </div>
              <div className={cn("text-sm shrink-0", timeColor)}>
                {item.timeRemaining}
              </div>
            </div>
          );
        })}
      </div>

      <button className="w-full py-4 text-xs font-medium text-text-muted hover:text-text-primary flex items-center justify-center gap-1 mt-4">
        View all <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
};
