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
  return;
};