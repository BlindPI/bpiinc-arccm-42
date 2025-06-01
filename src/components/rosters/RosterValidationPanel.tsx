
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  WrenchIcon
} from 'lucide-react';
import { useRosterValidation } from '@/hooks/useRosterValidation';

export function RosterValidationPanel() {
  const {
    validationResults,
    isValidating,
    fixAllCounts,
    isFixingAll,
    fixSpecificCount,
    isFixingSpecific,
    hasDiscrepancies
  } = useRosterValidation();

  if (isValidating) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            Validating roster counts...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasDiscrepancies) {
    return (
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          All roster certificate counts are accurate and up to date.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Roster Count Validation Issues
          </CardTitle>
          <Button
            onClick={() => fixAllCounts()}
            disabled={isFixingAll}
            className="gap-2"
          >
            {isFixingAll ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <WrenchIcon className="h-4 w-4" />
            )}
            Fix All Counts
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Found {validationResults?.length} rosters with incorrect certificate counts. 
            These discrepancies may be caused by data migration or synchronization issues.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          {validationResults?.map((result) => (
            <div 
              key={result.rosterId}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <div className="font-medium">{result.rosterName}</div>
                <div className="text-sm text-gray-600">
                  Stored: {result.storedCount} | Actual: {result.actualCount}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge 
                  variant={result.discrepancy > 0 ? "destructive" : "secondary"}
                  className="min-w-[80px] justify-center"
                >
                  {result.discrepancy > 0 ? '+' : ''}{result.discrepancy}
                </Badge>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fixSpecificCount(result.rosterId)}
                  disabled={isFixingSpecific}
                  className="gap-2"
                >
                  {isFixingSpecific ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <WrenchIcon className="h-3 w-3" />
                  )}
                  Fix
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
