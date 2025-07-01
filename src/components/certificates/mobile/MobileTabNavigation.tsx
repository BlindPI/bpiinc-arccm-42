
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface MobileTabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function MobileTabNavigation({ tabs, activeTab, onTabChange }: MobileTabNavigationProps) {
  const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
  const activeTabData = tabs[activeIndex];

  const handlePrevious = () => {
    const newIndex = activeIndex > 0 ? activeIndex - 1 : tabs.length - 1;
    onTabChange(tabs[newIndex].id);
  };

  const handleNext = () => {
    const newIndex = activeIndex < tabs.length - 1 ? activeIndex + 1 : 0;
    onTabChange(tabs[newIndex].id);
  };

  return (
    <div className="space-y-4">
      {/* Current Tab Display */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevious}
            className="p-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <activeTabData.icon className="h-5 w-5 text-primary" />
              <span className="font-medium text-primary">{activeTabData.label}</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {activeTabData.description}
            </p>
            <Badge variant="outline" className="text-xs">
              {activeIndex + 1} of {tabs.length}
            </Badge>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            className="p-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tab Dots Indicator */}
      <div className="flex justify-center gap-2">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-200",
              index === activeIndex 
                ? "bg-primary w-6" 
                : "bg-gray-300 hover:bg-gray-400"
            )}
            aria-label={`Go to ${tab.label}`}
          />
        ))}
      </div>

      {/* Quick Access Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {tabs.slice(0, 4).map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            size="sm"
            onClick={() => onTabChange(tab.id)}
            className="flex items-center gap-2 h-auto p-3"
          >
            <tab.icon className="h-4 w-4" />
            <span className="text-xs">{tab.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
