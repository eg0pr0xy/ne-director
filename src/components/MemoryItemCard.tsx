import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ShieldCheck, Sparkles, Clock, AlertCircle, Check, Eye } from 'lucide-react';
import { cn } from '../utils/cn';

export interface MemoryItemData {
  id: string;
  tag: string;
  statement: string;
  source: string;
  confidence: 'High' | 'Medium' | 'Low';
  domain: 'TRAVEL' | 'CASTING' | 'BUDGET' | 'CREATIVE' | 'SCHEDULE';
  ruleDescription: string;
  systemBehavior: string;
  learnedDate: string;
  triggerCount: number;
  exceptions?: string;
  appliesTo: string[];
}

interface MemoryItemCardProps {
  item: MemoryItemData;
  onForget?: (id: string) => void;
  onEdit?: (id: string) => void;
  defaultExpanded?: boolean;
}

export const MemoryItemCard: React.FC<MemoryItemCardProps> = ({
  item,
  onForget,
  onEdit,
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div 
      className={cn(
        "memory-item bg-surface border rounded-2xl transition-colors duration-200 overflow-hidden",
        isExpanded ? "border-border-focus shadow-sm" : "border-border hover:border-border-hover",
        isPaused && "opacity-60"
      )}
    >
      {/* Header / Summary row */}
      <header
        onClick={() => setIsExpanded(prev => !prev)}
        className="memory-item-header p-5 flex justify-between items-start cursor-pointer select-none group"
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(prev => !prev);
          }
        }}
      >
        <div className="flex-1 pr-4 min-w-0">
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <span className="text-[10px] text-text-muted font-bold tracking-widest uppercase">
              {item.tag}
            </span>
            <span 
              className={cn(
                "text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border",
                item.confidence === 'High' 
                  ? "bg-green-500/10 text-green-500 border-green-500/20" 
                  : item.confidence === 'Medium'
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  : "bg-blue-500/10 text-blue-500 border-blue-500/20"
              )}
            >
              {item.confidence} Confidence
            </span>
            {isPaused && (
              <span className="text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-border text-text-muted border border-border">
                Paused
              </span>
            )}
          </div>

          <div className="text-sm text-text-primary font-medium mb-2 group-hover:text-text-primary transition-colors">
            {item.statement}
          </div>

          <div className="text-xs text-text-secondary flex items-center gap-2 flex-wrap">
            <span>Source: {item.source}</span>
            <span className="text-text-muted">•</span>
            <span className="text-text-muted">
              Applied {item.triggerCount} {item.triggerCount === 1 ? 'time' : 'times'}
            </span>
            <span className="text-text-muted">•</span>
            <span className="text-text-muted text-[11px] group-hover:underline">
              {isExpanded ? "Hide details" : "Show details & guardrails"}
            </span>
          </div>
        </div>

        {/* Quick action buttons & expand toggle */}
        <div 
          className="flex items-center gap-3 shrink-0" 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onEdit?.(item.id)}
              className="text-xs text-text-muted hover:text-text-primary px-2 py-1 rounded-lg hover:bg-border transition-colors font-medium"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onForget?.(item.id)}
              className="text-xs text-[#E56A54] hover:opacity-80 px-2 py-1 rounded-lg hover:bg-[#E56A54]/10 transition-colors font-medium"
            >
              Forget
            </button>
          </div>

          <div className="h-4 w-px bg-border my-auto" />

          {/* Small chevron icon that rotates 180 degrees when expanded */}
          <button
            type="button"
            onClick={() => setIsExpanded(prev => !prev)}
            aria-label={isExpanded ? "Collapse memory item" : "Expand memory item"}
            aria-expanded={isExpanded}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-border transition-all flex items-center justify-center"
          >
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform duration-300 ease-in-out transform",
                isExpanded ? "rotate-180" : "rotate-0"
              )}
            />
          </button>
        </div>
      </header>

      {/* Smooth height transition animation container */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="memory-item-expanded-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: 'auto',
              opacity: 1,
              transition: {
                height: { 
                  duration: 0.36, 
                  ease: [0.16, 1, 0.3, 1] 
                },
                opacity: { 
                  duration: 0.24, 
                  delay: 0.06 
                }
              }
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                height: { 
                  duration: 0.28, 
                  ease: [0.16, 1, 0.3, 1] 
                },
                opacity: { 
                  duration: 0.15 
                }
              }
            }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-3 border-t border-border/80 space-y-4 text-xs bg-surface-hover/30">
              {/* How Chief of Staff acts on this */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-text-muted tracking-widest uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-text-muted" />
                  <span>Autonomous Behavior & Guardrail</span>
                </div>
                <p className="text-text-primary text-xs leading-relaxed bg-surface border border-border p-3 rounded-xl">
                  {item.ruleDescription}
                </p>
              </div>

              {/* System behavior & Exceptions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-surface border border-border p-3 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-text-muted tracking-widest uppercase block">
                    Execution Trigger
                  </span>
                  <p className="text-text-secondary leading-relaxed">
                    {item.systemBehavior}
                  </p>
                </div>

                <div className="bg-surface border border-border p-3 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-text-muted tracking-widest uppercase block">
                    Provenance & History
                  </span>
                  <div className="text-text-secondary space-y-0.5">
                    <div>{item.learnedDate}</div>
                    <div className="text-text-muted">Applied in {item.triggerCount} decisions to date</div>
                  </div>
                </div>
              </div>

              {/* Applies to & Scope tags */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-text-muted font-bold tracking-widest uppercase">
                    Applies To:
                  </span>
                  {item.appliesTo.map(tag => (
                    <span 
                      key={tag} 
                      className="px-2 py-0.5 rounded bg-border text-text-primary text-[10px] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsPaused(prev => !prev)}
                    className="px-2.5 py-1 rounded bg-border hover:bg-border-hover text-text-primary text-[11px] font-medium transition-colors"
                  >
                    {isPaused ? "Resume Rule" : "Pause Temporarily"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
