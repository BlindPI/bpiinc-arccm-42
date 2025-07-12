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
    return <Badge variant={isValid ? "default" : "destructive"}>
        {isValid ? "Ready" : "Issues"}
      </Badge>;
  };
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Production Readiness Check</h2>
      <div className="flex items-center gap-2">
        {getStatusIcon(validation.isValid)}
        {getStatusBadge(validation.isValid)}
        <span>Configuration Status</span>
      </div>
      {validation.errors.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-red-600">Errors:</h3>
          {validation.errors.map((error, index) => (
            <p key={index} className="text-sm text-red-600">{error}</p>
          ))}
        </div>
      )}
      {validation.warnings.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-amber-600">Warnings:</h3>
          {validation.warnings.map((warning, index) => (
            <p key={index} className="text-sm text-amber-600">{warning}</p>
          ))}
        </div>
      )}
    </div>
  );
};