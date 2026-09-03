import React, { useState } from 'react';
import { useApp } from '../store/AppStore';
import { ChevronRight, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { ApproveConfirmModal } from '../components/ApproveConfirmModal';
import { AttentionItem } from '../types';
import { OrdoStatusBanner } from '../components/OrdoStatusBanner';

export const AttentionPage = () => {
  const { attentionItems, openDrawer, approveDecision } = useApp();
  const [activeTab, setActiveTab] = useState<'needs_you' | 'waiting' | 'delegated' | 'fyi' | 'resolved'>('needs_you');
  const [modalItem, setModalItem] = useState<AttentionItem | null>(null);

  const tabs = [
    { id: 'needs_you', label: 'NEEDS YOU' },
    { id: 'waiting', label: 'WAITING' },
    { id: 'delegated', label: 'DELEGATED' },
    { id: 'fyi', label: 'FYI' },
    { id: 'resolved', label: 'RESOLVED' }
  ] as const;

  const currentItems = attentionItems.filter(item => item.status === activeTab);
  
  // Also waitingFor from todayState? The prompt says Waiting should have Lukas, Anna, Mila, Jonas. We can use mockWaitingFor or define them in attentionItems. Let's just use attentionItems with status='waiting' - wait, we only defined needs_you, delegated, fyi, resolved in attentionItems so far. 
  // Let me add waiting items to attentionItems inside data.ts or just render them based on todayState.waitingFor here?
  // It's cleaner to add them to attentionItems in data.ts.

  return (
    <div className="px-8 py-10 max-w-[1200px] mx-auto pb-32 min-h-full flex flex-col">
      <header className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-text-primary uppercase mb-1">
            ATTENTION
          </h1>
          <p className="text-text-secondary text-sm tracking-wide">Operational signals requiring your awareness.</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="bg-surface-hover border border-border-hover text-text-primary text-sm rounded-lg px-3 py-2 outline-none">
            <option>All Projects</option>
            <option>Harbour</option>
          </select>
          <select className="bg-surface-hover border border-border-hover text-text-primary text-sm rounded-lg px-3 py-2 outline-none">
            <option>Urgency</option>
            <option>Type</option>
            <option>Person</option>
          </select>
        </div>
      </header>

      {/* Tabs */}
      <OrdoStatusBanner />
      
      <div className="flex items-center gap-6 border-b border-border mb-8">
        {tabs.map(tab => {
          const count = attentionItems.filter(i => i.status === tab.id).length;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "pb-4 text-sm font-semibold tracking-wide uppercase transition-colors relative flex items-center gap-2",
                isActive ? "text-text-primary" : "text-text-muted hover:text-text-primary"
              )}
            >
              {tab.label}
              {count > 0 && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold",
                  isActive ? "bg-border-hover text-text-primary" : "bg-border text-text-muted"
                )}>
                  {count}
                </span>
              )}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-bg-inverted" />
              )}
            </button>
          )
        })}
      </div>

      <div className="flex-1 space-y-4">
        {currentItems.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-16 text-center">
            <p className="text-text-secondary">No signals in this view.</p>
          </div>
        ) : (
          currentItems.map(item => (
            <AttentionCard 
              key={item.id} 
              item={item} 
              onReview={() => openDrawer(item)}
              onApprove={() => setModalItem(item)}
            />
          ))
        )}
      </div>

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

const AttentionCard: React.FC<{ item: AttentionItem, onReview: () => void, onApprove: () => void }> = ({ item, onReview, onApprove }) => {
  const { getPerson } = useApp();
  const person = item.personId ? getPerson(item.personId) : null;
  const isNeedsYou = item.status === 'needs_you';

  return (
    <div 
      onClick={onReview}
      className={cn(
        "group bg-surface border border-border hover:border-border-hover rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center relative transition-all duration-300 cursor-pointer",
        item.status === 'resolved' && "opacity-60"
      )}
    >
      {isNeedsYou && (
        <div className="w-1.5 h-1.5 rounded-full bg-[#E56A54] shrink-0 mt-3 md:mt-0" />
      )}

      {item.status === 'resolved' && (
        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" strokeWidth={1.5} />
      )}

      <div className="flex-1 flex gap-5 w-full items-start">
        {item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt="" className="w-24 h-16 rounded-md object-cover bg-border shrink-0" />
        ) : isNeedsYou ? (
          <div className="w-16 h-16 rounded-md bg-surface border border-border shrink-0 flex items-center justify-center">
             <FileText className="w-6 h-6 text-text-secondary" strokeWidth={1.5} />
          </div>
        ) : null}

        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-3 mb-1">
            <h4 className={cn("text-sm font-semibold tracking-wide uppercase", item.status === 'resolved' ? "text-text-primary" : "text-text-primary")}>
              {item.title}
            </h4>
            {person && (
              <span className="text-xs text-text-muted bg-border px-2 py-0.5 rounded uppercase tracking-wider">
                {person.role} · {person.name}
              </span>
            )}
          </div>
          <p className="text-[13px] text-text-secondary mt-1 whitespace-pre-wrap">{item.subtitle}</p>
          
          <div className="flex items-center gap-4 mt-3">
            {item.deadline && (
              <span className="text-xs text-[#E56A54] font-medium">Deadline {item.deadline}</span>
            )}
            {item.remainingTime && (
              <span className="text-xs text-text-muted">{item.remainingTime}</span>
            )}
            {item.source && (
              <span className="text-xs text-text-muted uppercase tracking-widest">{item.source.system}</span>
            )}
          </div>
        </div>
      </div>

      {isNeedsYou && (
        <div className="flex md:flex-row gap-3 shrink-0 w-full md:w-auto justify-end" onClick={e => e.stopPropagation()}>
          <button 
            onClick={onReview}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-medium transition-colors text-text-primary border border-border-hover hover:bg-border hover:text-text-primary"
            )}
          >
            {item.type === 'decision' ? 'Review' : 'Show Changes'}
          </button>
          {item.type === 'decision' && (
            <button 
              onClick={onApprove}
              className="px-6 py-2 rounded-lg text-sm font-medium text-text-inverted bg-bg-inverted hover:bg-bg-inverted-hover transition-colors"
            >
              {item.title === 'LOCATION B' ? 'Approve B' : (item.title.includes('CASTING') ? 'Open Casting' : 'Approve')}
            </button>
          )}
        </div>
      )}
      {!isNeedsYou && item.status !== 'resolved' && (
        <div className="flex md:flex-row gap-3 shrink-0 w-full md:w-auto justify-end" onClick={e => e.stopPropagation()}>
           <button 
             onClick={onReview}
             className="px-6 py-2 rounded-lg text-sm font-medium text-text-primary border border-border-hover hover:bg-border hover:text-text-primary transition-colors"
           >
             Details
           </button>
        </div>
      )}

      {/* Right Arrow */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2">
        <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary transition-colors" />
      </div>
    </div>
  );
};
