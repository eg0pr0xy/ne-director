import React from 'react';
import { useApp } from '../../store/AppStore';
import { ChevronRight, CheckCircle2 } from 'lucide-react';

export const HandledModule = () => {
  const { todayState } = useApp();

  if (!todayState) return null;

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-sm font-semibold tracking-wider text-text-primary uppercase">I Handled</h3>
      </div>

      <div className="flex-1 space-y-6">
        {todayState.handled.map(item => (
          <div key={item.id} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" strokeWidth={1.5} />
              <span className="text-[13px] text-text-primary">{item.description}</span>
            </div>
            <span className="text-sm text-text-secondary shrink-0">{item.time}</span>
          </div>
        ))}
      </div>

      <button className="w-full py-4 text-xs font-medium text-text-muted hover:text-text-primary flex items-center justify-center gap-1 mt-4">
        View all handled <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
};
