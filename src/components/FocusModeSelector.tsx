import React from 'react';
import { useApp } from '../store/AppStore';
import { Focus, Check } from 'lucide-react';
import { FocusMode } from '../types';
import { cn } from '../utils/cn';

export const FocusModeSelector = () => {
  const { focusMode, setFocusMode } = useApp();
  const [isOpen, setIsOpen] = React.useState(false);

  const modes: { id: FocusMode; label: string }[] = [
    { id: 'NORMAL', label: 'NORMAL' },
    { id: 'ON_SET', label: 'ON SET' },
    { id: 'DEVELOPMENT', label: 'DEVELOPMENT' },
    { id: 'TRAVEL', label: 'TRAVEL' },
    { id: 'FESTIVAL', label: 'FESTIVAL' },
    { id: 'DEEP_WORK', label: 'DEEP WORK' },
  ];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full border transition-colors",
          focusMode !== 'NORMAL' 
            ? "border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20" 
            : "border-border-hover bg-surface text-text-primary hover:bg-border hover:text-text-primary"
        )}
      >
        <Focus className={cn("w-4 h-4", focusMode !== 'NORMAL' ? "text-amber-500" : "text-text-secondary")} />
        <span className="text-sm font-medium">{focusMode.replace('_', ' ')}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border-hover rounded-xl shadow-2xl z-50 overflow-hidden py-1">
            {modes.map(mode => (
              <button
                key={mode.id}
                onClick={() => {
                  setFocusMode(mode.id);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-border hover:text-text-primary flex items-center justify-between group"
              >
                <span>{mode.label}</span>
                {focusMode === mode.id && <Check className="w-4 h-4 text-text-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
