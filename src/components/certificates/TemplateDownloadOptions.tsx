
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, FileText } from 'lucide-react';

export function TemplateDownloadOptions() {
  return (
    <div className="flex flex-wrap gap-4 mt-4">
      <div className="flex flex-col gap-2">
        <Button variant="outline" size="sm" asChild className="gap-2">
          <a href="https://seaxchrsbldrppupupbw.supabase.co/storage/v1/object/public/roster-template/roster_template.xlsx" target="_blank" rel="noopener noreferrer">
            <FileSpreadsheet className="w-4 h-4" />
            Download XLSX Template
          </a>
        </Button>
        <span className="text-xs text-muted-foreground text-center">Excel format (.xlsx)</span>
      </div>

      <div className="flex flex-col gap-2">
        <Button variant="outline" size="sm" asChild className="gap-2">
          <a href="https://seaxchrsbldrppupupbw.supabase.co/storage/v1/object/public/roster-template/roster_template.csv" target="_blank" rel="noopener noreferrer">
            <FileText className="w-4 h-4" />
            Download CSV Template
          </a>
        </Button>
        <span className="text-xs text-muted-foreground text-center">CSV format (.csv)</span>
      </div>
    </div>
  );
}
