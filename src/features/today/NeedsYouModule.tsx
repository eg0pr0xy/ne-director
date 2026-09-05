import React, { useState } from 'react';
import { useApp } from '../../store/AppStore';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { cn } from '../../utils/cn';
import { AttentionItem } from '../../types';
import { ApproveConfirmModal } from '../../components/ApproveConfirmModal';

export const NeedsYouModule = () => {
  const { todayState, openDrawer, approveDecision } = useApp();
  const [modalItem, setModalItem] = useState<AttentionItem | null>(null);

  if (!todayState) return null;

  const items = todayState.needsYou;

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <h3 className="text-sm font-semibold tracking-wider text-text-primary uppercase">Needs You</h3>
        {items.length > 0 && (
          <span className="w-5 h-5 rounded-full bg-[#E56A54]/20 text-[#E56A54] flex items-center justify-center text-[11px] font-bold">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 bg-surface-hover border border-border rounded-xl border-dashed">
          <p className="text-text-primary text-sm font-medium mb-2">Nothing needs you right now.</p>
          <p className="text-text-muted text-xs">The Chief of Staff is still tracking active obligations.</p>
          <p className="text-text-muted text-xs">No intervention is currently required.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <NeedsYouCard 
              key={item.id} 
              item={item} 
              onReview={() => openDrawer(item)}
              onApprove={() => setModalItem(item)}
            />
          ))}
        </div>
      )}
      
      {items.length > 0 && (
        <button className="w-full py-4 text-xs font-medium text-text-muted hover:text-text-primary flex items-center justify-center gap-1 mt-2">
          View all needs <ChevronDown className="w-3 h-3" />
        </button>
      )}

      <ApproveConfirmModal 
        isOpen={!!modalItem}
        onClose={() => setModalItem(null)}
        onConfirm={() => {
          if (modalItem) approveDecision(modalItem.id, modalItem.title);
        }}
        title={modalItem?.title || ''}
      />
    </div>
  );
};

const NeedsYouCard: React.FC<{ item: AttentionItem, onReview: () => void, onApprove: () => void }> = ({ item, onReview, onApprove }) => {
  return (
    <div 
      onClick={onReview}
      className="group bg-surface-hover hover:border-border-hover border border-transparent rounded-xl p-4 flex flex-col md:flex-row gap-5 items-start md:items-center relative transition-all duration-300 cursor-pointer"
    >
      
      {/* Red Dot */}
      <div className="w-1.5 h-1.5 rounded-full bg-[#E56A54] shrink-0 mt-3 md:mt-0" />

      <div className="flex-1 flex gap-4 w-full items-start">
        {item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt="" className="w-24 h-16 rounded-md object-cover bg-border shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-md bg-surface border border-border shrink-0 flex items-center justify-center">
             <FileText className="w-6 h-6 text-text-secondary" strokeWidth={1.5} />
          </div>
        )}

        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center justify-between gap-4">
            <h4 className="text-sm font-semibold text-text-primary tracking-wide uppercase">{item.title}</h4>
            {item.remainingTime && (
              <span className="text-sm text-text-secondary shrink-0">{item.remainingTime}</span>
            )}
          </div>
          <p className="text-sm text-text-secondary mt-1 line-clamp-1">{item.subtitle}</p>
          {item.context?.details && <p className="text-[10px] uppercase tracking-wider text-text-muted mt-2">Why is this here? {item.context.details}</p>}
          {item.deadline && (
            <p className="text-xs text-[#E56A54] mt-1.5 font-medium">Deadline {item.deadline}</p>
          )}
        </div>
      </div>

      <div className="flex md:flex-row gap-3 shrink-0 w-full md:w-auto justify-end" onClick={e => e.stopPropagation()}>
        <button 
          onClick={onReview}
          className={cn(
            "px-6 py-2 rounded-lg text-sm font-medium transition-colors",
            "text-text-primary border border-border-hover hover:bg-border hover:text-text-primary"
          )}
        >
          {item.type === 'decision' ? 'Review' : 'Show Changes'}
        </button>
        {item.type === 'decision' && (
          <button 
            onClick={item.title === 'LOCATION B' ? onApprove : onReview}
            className="px-6 py-2 rounded-lg text-sm font-medium text-text-inverted bg-bg-inverted hover:bg-bg-inverted-hover transition-colors"
          >
            {item.title === 'LOCATION B' ? 'Approve B' : 'Open Casting'}
          </button>
        )}
      </div>

      {/* Right Arrow */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary transition-colors" />
      </div>
    </div>
  );
};
