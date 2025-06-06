
import { Button } from '@/components/ui/button';
import { FileSpreadsheet } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export function TemplateDownloadOptions() {
  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          The roster template includes columns for First Aid Level, CPR Level, and Course Length 
          to enable automatic course matching. Fill these fields to ensure students are assigned to the correct certificates.
        </AlertDescription>
      </Alert>
      
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-2">
          <Button variant="outline" size="sm" asChild className="gap-2">
            <a href="https://seaxchrsbldrppupupbw.supabase.co/storage/v1/object/public/roster-template/roster_template.xlsx" target="_blank" rel="noopener noreferrer">
              <FileSpreadsheet className="w-4 h-4" />
              Download Template
            </a>
          </Button>
          <span className="text-xs text-muted-foreground text-center">Excel format (.xlsx)</span>
        </div>
      </div>
    </div>
  );
}
