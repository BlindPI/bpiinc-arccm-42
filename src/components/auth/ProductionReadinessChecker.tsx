
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { validateSupabaseConfiguration, ConfigurationValidationResult } from '@/utils/configurationValidator';

export const ProductionReadinessChecker: React.FC = () => {
  const [validation, setValidation] = useState<ConfigurationValidationResult | null>(null);

  useEffect(() => {
    setValidation(validateSupabaseConfiguration());
  }, []);

  if (!validation) return null;

  const getStatusIcon = (isValid: boolean) => {
    return isValid ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusBadge = (isValid: boolean) => {
    return (
      <Badge variant={isValid ? "default" : "destructive"}>
        {isValid ? "Ready" : "Issues"}
      </Badge>
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon(validation.isValid)}
          Production Readiness Status
          {getStatusBadge(validation.isValid)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Environment:</strong> {validation.environment}
          </div>
          <div>
            <strong>Project ID:</strong> {validation.projectId || 'Unknown'}
          </div>
        </div>

        {validation.errors.length > 0 && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Critical Issues:</strong>
              <ul className="mt-2 list-disc list-inside">
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {validation.warnings.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warnings:</strong>
              <ul className="mt-2 list-disc list-inside">
                {validation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {validation.isValid && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Configuration is valid and ready for production deployment.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
