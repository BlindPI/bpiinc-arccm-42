
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
    <div className="border-b border-muted">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {steps.map((s) => (
            <div key={s.number} className="flex flex-col items-center">
              <div 
                className={`flex items-center justify-center w-10 h-10 rounded-full font-medium text-sm mb-2 transition-colors ${
                  step > s.number 
                    ? 'bg-primary text-white' 
                    : step === s.number 
                      ? 'bg-accent text-primary border-2 border-primary' 
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {step > s.number ? <Check className="h-5 w-5" /> : s.number}
              </div>
              <span 
                className={`text-xs font-medium ${
                  step >= s.number 
                    ? 'text-primary' 
                    : 'text-muted-foreground'
                }`}
              >
                {s.title}
              </span>
              {s.number < steps.length && (
                <div className={`hidden md:block h-[2px] w-20 bg-muted ${
                  step > s.number ? 'bg-primary' : ''
                } absolute left-1/2 transform translate-x-5`} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
