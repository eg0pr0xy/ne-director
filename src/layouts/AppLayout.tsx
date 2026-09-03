import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppStore';
import { AppSidebar } from './AppSidebar';
import { CommandBar } from './CommandBar';
import { ContextDrawer } from './ContextDrawer';
import { CheckCircle2, X, Menu } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../utils/cn';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toastMessage, hideToast, currentPage } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentPage]);

  return (
    <div className="flex h-screen w-full bg-bg overflow-hidden text-text-primary font-sans selection:bg-border-focus">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-overlay z-40 lg:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar Container */}
      <div className={cn(
        "app-sidebar fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0 h-full",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <AppSidebar />
      </div>

      <div className="flex-1 flex flex-col relative min-w-0">
        {/* Mobile Header with Hamburger */}
        <header className="lg:hidden flex items-center justify-between p-6 border-b border-border bg-bg">
          <h1 className="text-xl font-bold tracking-tight text-text-primary leading-none">
            NE <span className="text-[10px] font-medium text-text-muted tracking-[0.3em] uppercase ml-1">DIRECTOR</span>
          </h1>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="app-sidebar-toggle p-2 -mr-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg bg-border"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
        <CommandBar />
      </div>
      <ContextDrawer />

      {/* Global Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-8 z-50 flex items-center gap-3 bg-surface border border-border-hover shadow-2xl rounded-xl p-4 pr-3 min-w-[300px]"
          >
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-green-500" strokeWidth={2} />
            </div>
            <p className="text-sm font-medium text-text-primary flex-1">{toastMessage}</p>
            <button 
              onClick={hideToast}
              className="p-1.5 text-text-muted hover:text-text-primary hover:bg-border-hover rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
