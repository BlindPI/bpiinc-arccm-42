
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ProcessingStatus as ProcessingStatusType } from './types';

interface ProcessingStatusProps {
  status: ProcessingStatusType;
}

export function ProcessingStatus({ status }: ProcessingStatusProps) {
  return (
    <Alert>
      <AlertDescription>
        Processing: {status.processed} / {status.total}
        <br />
        Successful: {status.successful}
        <br />
        Failed: {status.failed}
        {status.errors.length > 0 && (
          <div className="mt-2">
            <strong>Errors:</strong>
            <ul className="list-disc pl-5">
              {status.errors.map((error, index) => (
                <li key={index} className="text-sm text-destructive">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
