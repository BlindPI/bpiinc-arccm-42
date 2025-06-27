
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { validateSupabaseConfiguration, ConfigurationValidation } from '@/utils/configurationValidator';

export const ProductionReadinessChecker: React.FC = () => {
  const [validation, setValidation] = useState<ConfigurationValidation | null>(null);

  useEffect(() => {
    setValidation(validateSupabaseConfiguration());
  }, []);

  if (!validation) return null;

  const getStatusIcon = (isValid: boolean) => {
    return isValid ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusBadge = (isValid: boolean) => {
    return <Badge variant={isValid ? "success" : "destructive"}>
      {isValid ? "Ready" : "Issues"}
    </Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon(validation.isValid)}
          Production Readiness
          {getStatusBadge(validation.isValid)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {validation.errors.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc pl-4">
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        {validation.warnings.length > 0 && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc pl-4">
                {validation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        {validation.isValid && (
          <p className="text-green-600">All configuration checks passed!</p>
        )}
      </CardContent>
    </Card>
  );
};
