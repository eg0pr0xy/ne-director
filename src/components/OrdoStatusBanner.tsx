import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const OrdoStatusBanner = () => {
  return (
    <div className="mb-8 bg-[#1A1513] border border-[#E56A54]/20 rounded-xl p-4 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <AlertTriangle className="w-5 h-5 text-[#E56A54] shrink-0 mt-0.5" />
      <div>
        <h4 className="text-sm font-medium text-[#E56A54]">ORDO unavailable</h4>
        <p className="text-sm text-[#E56A54]/70 mt-1">Current production state could not be verified. Last confirmed 10:42</p>
      </div>
    </div>
  );
};
