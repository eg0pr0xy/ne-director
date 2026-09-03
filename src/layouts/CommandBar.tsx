import React, { useState } from 'react';
import { Paperclip, Mic, ArrowUp, Lock, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useApp } from '../store/AppStore';

export const CommandBar = () => {
  const [value, setValue] = useState('');
  const [mockResponse, setMockResponse] = useState<string | null>(null);
  const { setCurrentPage, attentionItems } = useApp();

  const handleSubmit = () => {
    if (!value.trim()) return;
    
    const query = value.toLowerCase();
    
    if (query.includes('open with anna')) {
      const openAnnaItems = attentionItems.filter(i => i.personId === 'p1' && i.status !== 'resolved');
      setMockResponse(`${openAnnaItems.length} things are open with Anna.`);
    } else if (query.includes('location b')) {
      const locB = attentionItems.find(i => i.id === 'a1');
      if (locB && locB.status === 'resolved') {
        setMockResponse("Location B was approved and the decision was relayed to the team.");
      } else {
        setMockResponse("Location B is waiting for your decision.");
      }
    } else {
      setMockResponse("I am Chief of Staff. This is a prototype response surface. Ask 'What is open with Anna?' or 'What happened with Location B?'.");
    }
    
    // Auto clear input
    setValue('');
  };

  return (
    <div className="px-8 pb-6 pt-4 flex flex-col items-center justify-center bg-bg border-t border-border relative z-40">
      
      <AnimatePresence>
        {mockResponse && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full mb-6 w-full max-w-2xl bg-surface-hover border border-border-hover rounded-2xl p-6 shadow-2xl"
          >
            <button 
              onClick={() => setMockResponse(null)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-inner relative overflow-hidden">
                 <div className="absolute inset-0 bg-border-focus blur-[2px] rounded-full mix-blend-overlay"></div>
                 <div className="absolute top-1 right-1 w-3 h-3 bg-bg-inverted/40 rounded-full blur-[2px]"></div>
                 <div className="absolute bottom-1 left-1 w-4 h-4 bg-black/30 rounded-full blur-[3px]"></div>
              </div>
              <div>
                <p className="text-sm text-text-primary mb-4">{mockResponse}</p>
                
                {mockResponse.includes('Anna') && attentionItems.filter(i => i.personId === 'p1' && i.status !== 'resolved').length > 0 && (
                  <div className="space-y-4 mb-5">
                    {attentionItems.filter(i => i.personId === 'p1' && i.status !== 'resolved').map((item, index) => (
                      <div key={item.id} className="bg-surface border border-border p-4 rounded-xl">
                        <div className="text-sm text-text-primary font-medium mb-1">{index + 1}. {item.title}</div>
                        <div className="text-xs text-text-secondary">{item.subtitle.split('\n')[0]}</div>
                      </div>
                    ))}
                  </div>
                )}
                
                {mockResponse.includes('Anna') && (
                  <button 
                    onClick={() => {
                      setCurrentPage('PEOPLE');
                      setMockResponse(null);
                    }}
                    className="text-xs bg-bg-inverted text-text-inverted px-4 py-2 rounded-lg font-medium hover:bg-bg-inverted-hover transition-colors"
                  >
                    Open Anna
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-4xl flex items-center gap-3 bg-surface border border-border rounded-[20px] p-2 pl-3 shadow-lg shadow-black/5 dark:shadow-black/30 focus-within:border-border-focus focus-within:ring-1 focus-within:ring-border-focus transition-all">
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-inner relative overflow-hidden">
           <div className="absolute inset-0 bg-border-focus blur-[2px] rounded-full mix-blend-overlay"></div>
           <div className="absolute top-1 right-1 w-3 h-3 bg-bg-inverted/40 rounded-full blur-[2px]"></div>
           <div className="absolute bottom-1 left-1 w-4 h-4 bg-black/30 rounded-full blur-[3px]"></div>
        </div>
        
        <input 
          type="text" 
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Ask Chief of Staff..."
          className="flex-1 bg-transparent border-none outline-none text-text-primary text-[15px] placeholder:text-text-muted pl-2"
        />

        <div className="flex items-center gap-1 shrink-0 pr-1">
          <button className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-full hover:bg-surface-hover">
            <Paperclip className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <button className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-full hover:bg-surface-hover">
            <Mic className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <button 
            onClick={handleSubmit}
            className={`p-2 rounded-full transition-all flex items-center justify-center w-9 h-9 ml-1 ${
              value.trim() 
                ? 'bg-bg-inverted text-text-inverted hover:bg-bg-inverted-hover shadow-sm' 
                : 'bg-surface-hover text-text-muted border border-border'
            }`}
            disabled={!value.trim()}
          >
            <ArrowUp className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-2 text-xs text-text-muted mt-4">
        <Lock className="w-3 h-3 opacity-50" strokeWidth={2} />
        <span>Discreet. Confidential. Always.</span>
      </div>
    </div>
  );
};
