import React from 'react';
import { useApp } from '../store/AppStore';
import { Home, Radar, Briefcase, Users, SlidersHorizontal, Search, MessageSquare, Settings } from 'lucide-react';
import { cn } from '../utils/cn';

export const AppSidebar = () => {
  const { currentPage, setCurrentPage, todayState } = useApp();

  const needsYouCount = todayState?.needsYou.length || 0;

  const mainNav = [
    { id: 'TODAY', label: 'TODAY', icon: Home },
    { id: 'ATTENTION', label: 'ATTENTION', icon: Radar, badge: needsYouCount > 0 ? needsYouCount : undefined },
    { id: 'PROJECTS', label: 'PROJECTS', icon: Briefcase },
    { id: 'PEOPLE', label: 'PEOPLE', icon: Users },
    { id: 'TIMELINE', label: 'TIMELINE', icon: SlidersHorizontal },
  ] as const;

  const secondaryNav = [
    { id: 'SEARCH', label: 'SEARCH', icon: Search },
    { id: 'CHAT', label: 'CHAT', icon: MessageSquare },
  ] as const;

  return (
    <div className="w-64 bg-bg border-r border-border flex flex-col h-full flex-shrink-0">
      <div className="p-8 pt-10 pb-12">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary leading-none">
          NE<br/>
          <span className="text-[10px] font-medium text-text-muted tracking-[0.3em] mt-2 block uppercase">DIRECTOR</span>
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {mainNav.map((item) => {
          const isActive = currentPage === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                isActive 
                  ? "bg-surface-hover text-text-primary" 
                  : "text-text-secondary hover:bg-border hover:text-text-primary"
              )}
            >
              <div className="flex items-center gap-4">
                <Icon className={cn("w-[18px] h-[18px]", isActive ? "text-text-primary" : "text-text-muted group-hover:text-text-primary")} strokeWidth={isActive ? 2 : 1.5} />
                <span>{item.label}</span>
              </div>
              {(item as any).badge !== undefined && (
                <span className="bg-surface-hover border border-border-hover text-text-primary text-xs px-2 py-0.5 rounded-full min-w-[24px] text-center">
                  {(item as any).badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="my-6 border-t border-border mx-4"></div>

        {secondaryNav.map((item) => {
          const isActive = currentPage === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                isActive 
                  ? "bg-surface-hover text-text-primary" 
                  : "text-text-secondary hover:bg-border hover:text-text-primary"
              )}
            >
              <Icon className={cn("w-[18px] h-[18px]", isActive ? "text-text-primary" : "text-text-muted group-hover:text-text-primary")} strokeWidth={isActive ? 2 : 1.5} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 pb-6 mt-auto">
        <button 
          onClick={() => setCurrentPage('SETTINGS')}
          className={cn(
            "w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
            currentPage === 'SETTINGS'
              ? "bg-surface-hover text-text-primary" 
              : "text-text-secondary hover:bg-border hover:text-text-primary"
          )}
        >
          <Settings className={cn("w-[18px] h-[18px]", currentPage === 'SETTINGS' ? "text-text-primary" : "text-text-muted group-hover:text-text-primary")} strokeWidth={currentPage === 'SETTINGS' ? 2 : 1.5} />
          <span>SETTINGS</span>
        </button>
      </div>
    </div>
  );
};
