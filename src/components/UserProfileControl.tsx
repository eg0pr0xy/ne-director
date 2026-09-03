import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../store/AppStore';
import { ChevronDown, User, Settings, Brain } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../utils/cn';

export const UserProfileControl: React.FC = () => {
  const { profile, focusMode, setCurrentPage, openSettings } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handlePointerDown);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleNavigate = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const avatarSrc = profile.avatar || 'https://i.pravatar.cc/150?u=marcus';

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button: Avatar & Chevron */}
      <button
        id="user-profile-menu-trigger"
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="User Profile and Context Menu"
        className={cn(
          "flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
          isOpen 
            ? "bg-surface-hover border-border-hover" 
            : "bg-transparent border-transparent hover:bg-surface-hover hover:border-border"
        )}
      >
        <img
          src={avatarSrc}
          alt={profile.displayName}
          className="w-8 h-8 rounded-full object-cover bg-border-hover ring-1 ring-border shrink-0"
        />
        <ChevronDown
          className={cn(
            "w-4 h-4 text-text-muted transition-transform duration-200 ease-out",
            isOpen ? "rotate-180 text-text-primary" : "rotate-0"
          )}
        />
      </button>

      {/* Profile Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            id="user-profile-popover"
            role="menu"
            aria-orientation="vertical"
            className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl bg-surface border border-border-hover shadow-2xl z-50 overflow-hidden backdrop-blur-md"
          >
            {/* Header: User Name, Role & Status */}
            <div className="p-4 pb-3 border-b border-border">
              <div className="flex items-center justify-between gap-2">
                <div className="truncate">
                  <h2 className="text-sm font-semibold tracking-wide text-text-primary uppercase truncate">
                    {profile.displayName || 'Marcus'}
                  </h2>
                  <p className="text-xs text-text-secondary truncate mt-0.5">
                    {profile.professionalRole || 'Director'}
                  </p>
                </div>
                
                {/* Subtle current Focus Mode indicator */}
                <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted bg-surface-hover px-2 py-0.5 rounded-full border border-border shrink-0">
                  {focusMode}
                </span>
              </div>
            </div>

            {/* Navigation Menu Items */}
            <div className="p-2 space-y-0.5">
              <button
                id="popover-nav-profile"
                role="menuitem"
                onClick={() => handleNavigate(() => setCurrentPage('PROFILE'))}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors text-left group"
              >
                <div className="w-7 h-7 rounded-lg bg-surface-hover border border-border flex items-center justify-center shrink-0 group-hover:border-border-hover">
                  <User className="w-3.5 h-3.5 text-text-secondary group-hover:text-text-primary transition-colors" strokeWidth={1.75} />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-text-primary">My Profile</span>
                  <span className="text-[11px] text-text-muted leading-tight">Identity & working context</span>
                </div>
              </button>

              <button
                id="popover-nav-settings"
                role="menuitem"
                onClick={() => handleNavigate(() => openSettings('appearance'))}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors text-left group"
              >
                <div className="w-7 h-7 rounded-lg bg-surface-hover border border-border flex items-center justify-center shrink-0 group-hover:border-border-hover">
                  <Settings className="w-3.5 h-3.5 text-text-secondary group-hover:text-text-primary transition-colors" strokeWidth={1.75} />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-text-primary">Settings</span>
                  <span className="text-[11px] text-text-muted leading-tight">Preferences & system options</span>
                </div>
              </button>

              <button
                id="popover-nav-privacy-memory"
                role="menuitem"
                onClick={() => handleNavigate(() => openSettings('memory'))}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors text-left group"
              >
                <div className="w-7 h-7 rounded-lg bg-surface-hover border border-border flex items-center justify-center shrink-0 group-hover:border-border-hover">
                  <Brain className="w-3.5 h-3.5 text-text-secondary group-hover:text-text-primary transition-colors" strokeWidth={1.75} />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-text-primary">Privacy & Memory</span>
                  <span className="text-[11px] text-text-muted leading-tight">Context retention & trust</span>
                </div>
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Footer */}
            <div className="p-3 px-4 bg-surface-hover/50 flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider text-text-primary uppercase">
                NE DIRECTOR
              </span>
              <span className="text-[10px] tracking-widest text-text-muted uppercase font-mono">
                PROTOTYPE
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
