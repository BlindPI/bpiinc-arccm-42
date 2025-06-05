import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { runAllCRMTests, testCRMLeadInsert, testCRMFullInsert } from '@/utils/crmDebugTest';
import { CRMService } from '@/services/crm/crmService';

export function CRMDebugPanel() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    try {
      const results = await runAllCRMTests();
      setTestResults(results);
    } catch (error) {
      setTestResults({ error: 'Failed to run diagnostics', details: error });
    } finally {
      setIsRunning(false);
    }
  };

  const testCRMServiceDirectly = async () => {
    setIsRunning(true);
    try {
      console.log('Testing CRMService.createLead directly...');
      
      const testLead = {
        first_name: 'Debug',
        last_name: 'Test',
        email: `debug-${Date.now()}@example.com`,
        phone: '+1-555-0199',
        company: 'Debug Company',
        title: 'Debug Manager',
        status: 'new' as const,
        source: 'website' as const,
        score: 75,
        notes: 'Debug test lead'
      };

      const result = await CRMService.createLead(testLead);
      console.log('✅ CRMService.createLead successful:', result);
      
      // Clean up
      await CRMService.deleteLead(result.id);
      
      setTestResults({
        crmServiceTest: {
          success: true,
          message: 'CRMService.createLead worked successfully',
          result: result
        }
      });
    } catch (error) {
      console.error('❌ CRMService.createLead failed:', error);
      setTestResults({
        crmServiceTest: {
          success: false,
          error: 'CRMService.createLead failed',
          details: error
        }
      });
    } finally {
      setIsRunning(false);
    }
  };

  const formatError = (error: any) => {
    if (typeof error === 'object' && error !== null) {
      return JSON.stringify(error, null, 2);
    }
    return String(error);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>CRM Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            variant="outline"
          >
            {isRunning ? 'Running...' : 'Run Database Tests'}
          </Button>
          
          <Button 
            onClick={testCRMServiceDirectly} 
            disabled={isRunning}
            variant="default"
          >
            {isRunning ? 'Running...' : 'Test CRMService Directly'}
          </Button>
        </div>

        {testResults && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Test Results:</h3>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm max-h-96">
              {formatError(testResults)}
            </pre>
            
            {testResults.minimalTest && (
              <div className="mt-4">
                <h4 className="font-medium">Minimal Test:</h4>
                <div className={`p-2 rounded ${testResults.minimalTest.success ? 'bg-green-100' : 'bg-red-100'}`}>
                  {testResults.minimalTest.success ? '✅ PASSED' : '❌ FAILED'}
                  {testResults.minimalTest.error && (
                    <div className="text-sm mt-1">
                      Error: {testResults.minimalTest.error}
                      <br />
                      Code: {testResults.minimalTest.details?.code}
                      <br />
                      Message: {testResults.minimalTest.details?.message}
                    </div>
                  )}
                </div>
              </div>
            )}

            {testResults.fullTest && (
              <div className="mt-4">
                <h4 className="font-medium">Full Test:</h4>
                <div className={`p-2 rounded ${testResults.fullTest.success ? 'bg-green-100' : 'bg-red-100'}`}>
                  {testResults.fullTest.success ? '✅ PASSED' : '❌ FAILED'}
                  {testResults.fullTest.error && (
                    <div className="text-sm mt-1">
                      Error: {testResults.fullTest.error}
                      <br />
                      Code: {testResults.fullTest.details?.code}
                      <br />
                      Message: {testResults.fullTest.details?.message}
                    </div>
                  )}
                </div>
              </div>
            )}

            {testResults.crmServiceTest && (
              <div className="mt-4">
                <h4 className="font-medium">CRM Service Test:</h4>
                <div className={`p-2 rounded ${testResults.crmServiceTest.success ? 'bg-green-100' : 'bg-red-100'}`}>
                  {testResults.crmServiceTest.success ? '✅ PASSED' : '❌ FAILED'}
                  {testResults.crmServiceTest.error && (
                    <div className="text-sm mt-1">
                      Error: {testResults.crmServiceTest.error}
                      <br />
                      Details: {formatError(testResults.crmServiceTest.details)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-md">
          <h4 className="font-medium text-blue-800">Instructions:</h4>
          <ul className="text-sm text-blue-700 mt-2 space-y-1">
            <li>• <strong>Database Tests</strong>: Tests direct Supabase access and table structure</li>
            <li>• <strong>CRMService Test</strong>: Tests the actual frontend service that's failing</li>
            <li>• Check the browser console for detailed logs during testing</li>
            <li>• If tests fail, the error details will show the exact database issue</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}