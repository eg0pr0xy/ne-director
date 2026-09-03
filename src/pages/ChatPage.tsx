import React from 'react';

export const ChatPage = () => {
  return (
    <div className="px-8 py-10 max-w-[800px] mx-auto pb-32 flex flex-col h-full min-h-[70vh]">
      <header className="mb-10">
        <h1 className="text-[28px] font-semibold tracking-tight text-text-primary uppercase mb-1">
          CHAT
        </h1>
        <p className="text-text-secondary text-sm tracking-wide">Direct communication with Chief of Staff.</p>
      </header>
      
      <div className="flex-1 bg-surface border border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center">
         <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-inner relative overflow-hidden mb-6">
            <div className="absolute inset-0 bg-border-focus blur-[4px] rounded-full mix-blend-overlay"></div>
            <div className="absolute top-2 right-2 w-4 h-4 bg-bg-inverted/40 rounded-full blur-[3px]"></div>
         </div>
         <h2 className="text-xl font-semibold text-text-primary mb-2">How can I assist you?</h2>
         <p className="text-text-secondary max-w-sm mb-8">
           Use the global command bar below to ask me questions, delegate tasks, or request information about any project.
         </p>
         
         <div className="text-sm text-text-secondary bg-surface-hover border border-border px-4 py-2 rounded-lg">
           Try typing "What is still open with Anna?" below.
         </div>
      </div>
    </div>
  );
};
