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
    return isValid ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />;
  };
  const getStatusBadge = (isValid: boolean) => {
    return <Badge variant={isValid ? "default" : "destructive"}>
        {isValid ? "Ready" : "Issues"}
      </Badge>;
  };
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon(validation.isValid)}
          Production Readiness Status
          {getStatusBadge(validation.isValid)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {validation.message}
          </AlertDescription>
        </Alert>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="flex items-center gap-2">
            {getStatusIcon(validation.checks.database)}
            <span className="text-sm">Database</span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(validation.checks.auth)}
            <span className="text-sm">Authentication</span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(validation.checks.storage)}
            <span className="text-sm">Storage</span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(validation.checks.functions)}
            <span className="text-sm">Functions</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};