
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AccessibilityPanel } from '@/components/accessibility/AccessibilityPanel';
import { Eye } from 'lucide-react';

export const AccessibilityToggle: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          aria-label="Open accessibility settings"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Accessibility Settings</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <AccessibilityPanel />
        </div>
      </SheetContent>
    </Sheet>
  );
};
