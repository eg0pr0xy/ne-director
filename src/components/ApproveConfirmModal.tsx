import React, { useState } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
}

export const ApproveConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title }) => {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-overlay  z-50 transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-surface border border-border-hover rounded-2xl p-6 z-50 shadow-2xl">
        <h3 className="text-lg font-medium text-text-primary mb-2 tracking-wide">
          Approve {title}
        </h3>
        
        <div className="bg-surface-hover border border-border rounded-xl p-4 mb-6">
          <p className="text-sm font-medium text-text-primary mb-3">Chief of Staff will:</p>
          <ul className="space-y-2">
            <li className="text-sm text-text-secondary flex items-start gap-2">
              <span className="text-text-muted mt-0.5">•</span>
              <span>Record your decision</span>
            </li>
            <li className="text-sm text-text-secondary flex items-start gap-2">
              <span className="text-text-muted mt-0.5">•</span>
              <span>Prepare response to Anna</span>
            </li>
            <li className="text-sm text-text-secondary flex items-start gap-2">
              <span className="text-text-muted mt-0.5">•</span>
              <span>Mark the production decision resolved</span>
            </li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl text-sm font-medium text-text-primary bg-border hover:bg-border-hover transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="py-2.5 px-4 rounded-xl text-sm font-medium text-text-inverted bg-bg-inverted hover:bg-bg-inverted-hover transition-colors"
          >
            Approve
          </button>
        </div>
      </div>
    </>
  );
};
