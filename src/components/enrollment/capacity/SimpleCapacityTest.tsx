import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useRosterCapacityValidation } from '@/hooks/useRosterCapacityValidation';
import { RosterCapacityDisplay, CapacityStatusBadge } from './index';

interface SimpleCapacityTestProps {
  rosterId: string;
}

export function SimpleCapacityTest({ rosterId }: SimpleCapacityTestProps) {
  const [testResults, setTestResults] = useState<string[]>([]);

  const {
    capacityInfo,
    isLoading,
    isError,
    error,
    canEnroll,
    capacityStatusType
  } = useRosterCapacityValidation({
    rosterId,
    includeWaitlist: true
  });

  const runBasicTest = () => {
    setTestResults([]);
    
    if (isLoading) {
      setTestResults(['⏳ Loading capacity data...']);
      return;
    }
    
    if (isError) {
      setTestResults([`❌ Error: ${error?.message}`]);
      return;
    }
    
    const results = [
      '✅ Hook loaded successfully',
      `📊 Capacity Status: ${capacityStatusType}`,
      `🎯 Can Enroll: ${canEnroll ? 'Yes' : 'No'}`,
      `📈 Current Enrollment: ${capacityInfo?.current_enrollment || 0}`,
      `🏁 Max Capacity: ${capacityInfo?.max_capacity || 'Unlimited'}`
    ];
    
    setTestResults(results);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Capacity Integration Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runBasicTest} className="w-full">
            Run Basic Integration Test
          </Button>
          
          {testResults.length > 0 && (
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm p-2 bg-muted rounded">
                  {result}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {rosterId && !isLoading && !isError && (
        <Card>
          <CardHeader>
            <CardTitle>Live Capacity Display</CardTitle>
          </CardHeader>
          <CardContent>
            <RosterCapacityDisplay rosterId={rosterId} compact={true} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}