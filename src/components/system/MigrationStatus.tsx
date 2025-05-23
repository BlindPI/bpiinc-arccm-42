
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Loader2, Database, AlertTriangle, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { migrationManager, type MigrationResult, type DataValidationResult } from '@/utils/migrationUtils';
import { toast } from 'sonner';

interface MigrationStatusProps {
  onMigrationComplete?: () => void;
}

export const MigrationStatus: React.FC<MigrationStatusProps> = ({ onMigrationComplete }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [results, setResults] = useState<MigrationResult[]>([]);
  const [validationResult, setValidationResult] = useState<DataValidationResult | null>(null);
  const [migrationComplete, setMigrationComplete] = useState(false);

  const runMigration = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);
    setValidationResult(null);
    setMigrationComplete(false);

    try {
      setCurrentStep('Validating data integrity...');
      setProgress(10);
      
      const migrationResult = await migrationManager.runCompleteMigration();
      
      setProgress(100);
      setResults(migrationResult.results);
      setValidationResult(migrationResult.validationResult);
      setMigrationComplete(migrationResult.success);
      
      if (migrationResult.success) {
        toast.success('Migration completed successfully!');
        onMigrationComplete?.();
      } else {
        toast.error('Migration failed. Check the results below.');
      }
    } catch (error) {
      console.error('Migration error:', error);
      toast.error('Migration failed with an unexpected error');
      setResults([{
        success: false,
        message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]);
    } finally {
      setIsRunning(false);
      setCurrentStep('');
    }
  };

  const runRollback = async () => {
    setIsRollingBack(true);
    
    try {
      const rollbackResult = await migrationManager.rollbackMigration();
      
      if (rollbackResult.success) {
        toast.success('Rollback completed successfully!');
        setMigrationComplete(false);
        setResults([]);
      } else {
        toast.error('Rollback failed. Check console for details.');
      }
      
      setResults([rollbackResult]);
    } catch (error) {
      console.error('Rollback error:', error);
      toast.error('Rollback failed with an unexpected error');
    } finally {
      setIsRollingBack(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"}>
        {success ? "Success" : "Failed"}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Migration Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Migration Controls */}
        <div className="flex gap-4">
          <Button
            onClick={runMigration}
            disabled={isRunning || isRollingBack}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            {isRunning ? 'Running Migration...' : 'Run Migration'}
          </Button>
          
          {migrationComplete && (
            <Button
              onClick={runRollback}
              disabled={isRunning || isRollingBack}
              variant="destructive"
              className="flex items-center gap-2"
            >
              {isRollingBack ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              {isRollingBack ? 'Rolling Back...' : 'Rollback Migration'}
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{currentStep}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Validation Results */}
        {validationResult && (
          <Alert className={validationResult.isValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">
                  Data Validation: {validationResult.isValid ? "Passed" : "Failed"}
                </div>
                
                {validationResult.errors.length > 0 && (
                  <div>
                    <div className="font-medium text-red-600">Errors:</div>
                    <ul className="list-disc list-inside text-sm">
                      {validationResult.errors.map((error, index) => (
                        <li key={index} className="text-red-600">{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {validationResult.warnings.length > 0 && (
                  <div>
                    <div className="font-medium text-orange-600">Warnings:</div>
                    <ul className="list-disc list-inside text-sm">
                      {validationResult.warnings.map((warning, index) => (
                        <li key={index} className="text-orange-600">{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Migration Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Migration Results</h3>
            
            {results.map((result, index) => (
              <Card key={index} className={result.success ? "border-green-200" : "border-red-200"}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.success)}
                      <span className="font-medium">Step {index + 1}</span>
                    </div>
                    {getStatusBadge(result.success)}
                  </div>
                  
                  <p className="text-sm mb-2">{result.message}</p>
                  
                  {result.affectedRows !== undefined && (
                    <p className="text-xs text-gray-500">
                      Affected rows: {result.affectedRows}
                    </p>
                  )}
                  
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs font-medium text-red-600">Errors:</div>
                      <ul className="list-disc list-inside text-xs text-red-600">
                        {result.errors.map((error, errorIndex) => (
                          <li key={errorIndex}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Migration Complete Status */}
        {migrationComplete && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">
              Migration completed successfully! All dashboard hooks now have the required database tables and fallback data mechanisms.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
