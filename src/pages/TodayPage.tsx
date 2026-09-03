import React from 'react';
import { useApp } from '../store/AppStore';
import { ChevronDown, AlertTriangle } from 'lucide-react';
import { NeedsYouModule } from '../features/today/NeedsYouModule';
import { CalendarModule } from '../features/today/CalendarModule';
import { WaitingForModule } from '../features/today/WaitingForModule';
import { HandledModule } from '../features/today/HandledModule';
import { InsightsModule } from '../features/today/InsightsModule';
import { LiveTimelineModule } from '../features/today/LiveTimelineModule';
import { FocusModeSelector } from '../components/FocusModeSelector';
import { UserProfileControl } from '../components/UserProfileControl';
import { OnSetView } from '../features/today/OnSetView';
import { format } from 'date-fns';

export const TodayPage = () => {
  const { loading, focusMode, profile } = useApp();

  if (loading) {
    return (
      <div className="p-10">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-6 py-1">
            <div className="h-8 bg-border rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-32 bg-border rounded col-span-2"></div>
                <div className="h-32 bg-border rounded col-span-1"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const dateString = format(new Date(), 'EEEE, d MMMM');

  const greetingAddress = (profile?.preferredAddress || profile?.displayName || 'MARCUS').toUpperCase();

  return (
    <div className="px-8 py-10 max-w-[1600px] mx-auto pb-32 min-h-full flex flex-col">
      <header className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-text-primary uppercase mb-1">
            GOOD MORNING, {greetingAddress}.
          </h1>
          <p className="text-text-secondary text-sm tracking-wide">{dateString}</p>
        </div>

        <div className="flex items-center gap-4">
          <FocusModeSelector />
          <UserProfileControl />
        </div>
      </header>

      {focusMode === 'ON_SET' ? (
        <OnSetView />
      ) : (
        <div className="grid grid-cols-12 gap-6 flex-1 items-stretch">
          {/* Left Column (Needs You + I Handled + Insights) */}
          <div className="col-span-12 xl:col-span-6 flex flex-col gap-6">
            <NeedsYouModule />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
               <HandledModule />
               <InsightsModule />
            </div>
          </div>

          {/* Middle Column (Calendar) */}
          <div className="col-span-12 md:col-span-6 xl:col-span-3 flex flex-col">
             <CalendarModule />
          </div>

          {/* Right Column (Waiting For + Live Timeline) */}
          <div className="col-span-12 md:col-span-6 xl:col-span-3 flex flex-col gap-6">
             <WaitingForModule />
             <LiveTimelineModule />
          </div>
        </div>
      )}
    </div>
  );
};

