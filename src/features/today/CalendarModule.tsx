import React from 'react';
import { useApp } from '../../store/AppStore';
import { ChevronRight, MapPin } from 'lucide-react';
import { cn } from '../../utils/cn';
import { CalendarEvent } from '../../types';

export const CalendarModule = () => {
  const { todayState } = useApp();

  if (!todayState) return null;

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-sm font-semibold tracking-wider text-text-primary uppercase">Today</h3>
      </div>

      <div className="flex-1 space-y-7">
        {todayState.calendar.map(event => (
          <CalendarItem key={event.id} event={event} />
        ))}
      </div>

      <button className="w-full py-4 text-xs font-medium text-text-muted hover:text-text-primary flex items-center justify-center gap-1 mt-6">
        View full calendar <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
};

const CalendarItem: React.FC<{ event: CalendarEvent }> = ({ event }) => {
  const colorMap = {
    meeting: 'bg-blue-400',
    shoot: 'bg-violet-400',
    personal: 'bg-green-400',
    review: 'bg-amber-400'
  };

  return (
    <div className="flex gap-4 items-start">
      <div className="text-sm text-text-secondary w-12 shrink-0 pt-0.5">
        {event.time}
      </div>
      <div className="flex gap-4">
        <div className={cn("w-[3px] rounded-full shrink-0", colorMap[event.type])} />
        <div>
          <div className="text-sm font-medium text-text-primary leading-tight">{event.title}</div>
          <div className="text-[13px] text-text-secondary mt-1 flex items-center gap-1.5">
             {event.location.includes('Kino Babylon') && <MapPin className="w-3.5 h-3.5" />}
             {event.location}
          </div>
        </div>
      </div>
    </div>
  );
};
