import React from 'react';
import { useApp } from '../../store/AppStore';
import { ChevronRight, FileText, Calendar as CalIcon, Lightbulb } from 'lucide-react';
import { cn } from '../../utils/cn';

export const InsightsModule = () => {
  const { todayState } = useApp();

  if (!todayState) return null;

  const iconMap = {
    financial: { icon: FileText, color: 'text-[#B88BFF]', bg: 'bg-[#B88BFF]/10' },
    schedule: { icon: CalIcon, color: 'text-[#FF9D4A]', bg: 'bg-[#FF9D4A]/10' },
    logistical: { icon: Lightbulb, color: 'text-[#4DA6FF]', bg: 'bg-[#4DA6FF]/10' },
    creative: { icon: Lightbulb, color: 'text-[#4DA6FF]', bg: 'bg-[#4DA6FF]/10' }
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-sm font-semibold tracking-wider text-text-primary uppercase">Insights</h3>
      </div>

      <div className="flex-1 space-y-4">
        {todayState.insights.map(item => {
          const config = iconMap[item.type as keyof typeof iconMap] || iconMap.creative;
          const Icon = config.icon;
          
          return (
            <button key={item.id} className="w-full text-left group flex items-center gap-4 hover:bg-border rounded-xl transition-colors">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", config.bg, config.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 flex items-center justify-between gap-4">
                <span className="text-[13px] text-text-primary leading-snug">{item.description}</span>
                <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary shrink-0 transition-colors" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
