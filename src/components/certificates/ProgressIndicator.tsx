
import React from 'react';
import { Calendar, Check, FileText, Info } from 'lucide-react';

interface ProgressIndicatorProps {
  step: number;
}

export function ProgressIndicator({ step }: ProgressIndicatorProps) {
  return (
    <div className="bg-gradient-to-r from-primary to-blue-600 p-6">
      <h1 className="text-white text-2xl font-medium mb-4">Certificate Request</h1>
      <div className="flex justify-between items-center relative">
        <div className="absolute left-0 right-0 top-1/2 h-1 bg-white/30 -translate-y-1/2 z-0"></div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex flex-col items-center relative z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
              step >= i ? 'bg-white text-primary' : 'bg-white/30 text-white/70'
            }`}>
              {i === 1 && <FileText className="w-5 h-5" />}
              {i === 2 && <Info className="w-5 h-5" />}
              {i === 3 && <Calendar className="w-5 h-5" />}
              {i === 4 && <Check className="w-5 h-5" />}
            </div>
            <span className={`text-xs ${step >= i ? 'text-white' : 'text-white/70'}`}>
              {i === 1 ? 'Personal Info' : 
                i === 2 ? 'Course Details' : 
                i === 3 ? 'Dates' : 'Review'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
