
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Keyboard } from 'lucide-react';

interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: KeyboardShortcut[] = [
  { keys: ['/'], description: 'Focus search', category: 'Navigation' },
  { keys: ['Esc'], description: 'Clear focus/Close modals', category: 'Navigation' },
  { keys: ['Alt', 'H'], description: 'Show help', category: 'General' },
  { keys: ['Ctrl', 'N'], description: 'New item (context dependent)', category: 'Actions' },
  { keys: ['Ctrl', 'S'], description: 'Save current form', category: 'Actions' },
  { keys: ['?'], description: 'Show keyboard shortcuts', category: 'General' },
  { keys: ['G', 'D'], description: 'Go to Dashboard', category: 'Navigation' },
  { keys: ['G', 'U'], description: 'Go to Users', category: 'Navigation' },
  { keys: ['G', 'C'], description: 'Go to Courses', category: 'Navigation' },
  { keys: ['G', 'R'], description: 'Go to Reports', category: 'Navigation' },
];

export const KeyboardShortcutsDialog: React.FC = () => {
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" data-help-trigger>
          <Keyboard className="h-4 w-4" />
          Shortcuts
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category} className="space-y-3">
              <h3 className="font-medium text-lg">{category}</h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center space-x-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          <Badge variant="outline" className="px-2 py-1 text-xs font-mono">
                            {key}
                          </Badge>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-xs text-muted-foreground">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          <div className="text-xs text-muted-foreground pt-4 border-t">
            <p>Press <Badge variant="outline" className="px-1 py-0.5 text-xs">?</Badge> to show this dialog anytime</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
