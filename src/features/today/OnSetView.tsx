import React from 'react';
import { useApp } from '../../store/AppStore';
import { AlertCircle, Camera } from 'lucide-react';

export const OnSetView = () => {
  const { attentionItems, openDrawer } = useApp();

  const handleReview = () => {
    const urgentItem = attentionItems.find(i => i.id === 'a1') || attentionItems[0];
    if (urgentItem) {
      openDrawer(urgentItem);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center -mt-20">
      <div className="max-w-2xl w-full">
        <div className="bg-surface border border-amber-500/20 shadow-[0_0_40px_rgba(245,158,11,0.05)] rounded-3xl p-10 relative overflow-hidden">
          
          {/* subtle animated background element */}
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-10">
             <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
             <span className="text-amber-500 font-medium tracking-widest text-xs uppercase">ON SET MODE ACTIVE</span>
          </div>

          <div className="grid grid-cols-2 gap-12">
            <div>
              <h2 className="text-sm font-semibold tracking-widest text-text-muted uppercase mb-4">NEXT SHOT</h2>
              <div className="text-4xl font-serif text-text-primary mb-2">Scene 42</div>
              <div className="text-xl text-text-secondary">Shot 42C</div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-semibold tracking-widest text-text-muted uppercase mb-2">WAITING</h2>
                <div className="text-lg text-text-primary flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E56A54]" />
                  Lighting Setup
                </div>
              </div>
              
              <div>
                <h2 className="text-sm font-semibold tracking-widest text-text-muted uppercase mb-2">DECISION</h2>
                <div className="text-lg text-text-primary">
                  Background action timing
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold tracking-widest text-text-muted uppercase mb-2">ETA</h2>
                <div className="text-3xl font-light text-text-primary">
                  7 min
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-3 text-[#E56A54]">
               <AlertCircle className="w-5 h-5" />
               <span className="font-medium text-sm">1 Urgent Production Decision</span>
            </div>
            <button 
              onClick={handleReview}
              className="px-5 py-2.5 bg-border-hover hover:bg-border-focus text-text-primary text-sm font-medium rounded-xl transition-colors cursor-pointer"
            >
               Review
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};
