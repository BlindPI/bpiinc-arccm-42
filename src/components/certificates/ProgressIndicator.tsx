
import { Check } from 'lucide-react';

interface ProgressIndicatorProps {
  step: number;
}

export function ProgressIndicator({ step }: ProgressIndicatorProps) {
  const steps = [
    { number: 1, title: 'Personal Info' },
    { number: 2, title: 'Course Details' },
    { number: 3, title: 'Dates' },
    { number: 4, title: 'Review' }
  ];

  return (
    <div className="border-b border-gray-200 bg-white rounded-t-xl">
      <div className="container mx-auto px-8 py-5">
        <div className="flex items-center justify-between">
          {steps.map((s) => (
            <div key={s.number} className="flex flex-col items-center relative">
              <div 
                className={`flex items-center justify-center w-10 h-10 rounded-full font-medium text-sm mb-2 transition-all ${
                  step > s.number 
                    ? 'bg-primary text-white shadow-md' 
                    : step === s.number 
                      ? 'bg-primary/10 text-primary border-2 border-primary' 
                      : 'bg-gray-100 text-gray-400 border border-gray-200'
                }`}
              >
                {step > s.number ? <Check className="h-5 w-5" /> : s.number}
              </div>
              <span 
                className={`text-xs font-medium ${
                  step >= s.number 
                    ? 'text-primary' 
                    : 'text-gray-400'
                }`}
              >
                {s.title}
              </span>
              
              {s.number < steps.length && (
                <div className="absolute top-5 left-[calc(100%_-_10px)] w-[calc(100%_-_10px)] h-[2px]">
                  <div 
                    className={`h-full bg-gray-200 ${step > s.number ? 'bg-primary' : ''}`}
                    style={{ width: 'calc(100% - 20px)' }} 
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
