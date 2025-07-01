import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, XCircle, Play, Database, Settings, Zap } from 'lucide-react';
import { CRMDiagnostics } from '@/utils/crmDiagnostics';

export function CRMDiagnosticPanel() {
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    try {
      const results = await CRMDiagnostics.runFullDiagnostic();
      setDiagnosticResults(results);
      console.log('✅ CRM diagnostics completed successfully');
    } catch (error) {
      console.error('❌ Failed to run diagnostics:', error);
      alert('Failed to run diagnostics: ' + (error as Error).message);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (exists: boolean) => {
    return exists ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getSourceBadge = (source: string) => {
    const colors = {
      database: 'bg-green-100 text-green-800',
      hardcoded_mock: 'bg-yellow-100 text-yellow-800',
      error_or_mock: 'bg-red-100 text-red-800',
      unknown: 'bg-gray-100 text-gray-800'
    };
    return (
      <Badge className={colors[source as keyof typeof colors] || colors.unknown}>
        {source.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">CRM System Diagnostics</h2>
          <p className="text-muted-foreground">
            Analyze CRM functionality and identify issues with data sources and UI components
          </p>
        </div>
        <Button onClick={runDiagnostics} disabled={isRunning}>
          {isRunning ? (
            <>
              <Play className="h-4 w-4 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run Diagnostics
            </>
          )}
        </Button>
      </div>

      {diagnosticResults && (
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="functionality">Functionality</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Database Tables</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Object.values(diagnosticResults.databaseCheck.tablesExist).filter(Boolean).length}/
                    {Object.keys(diagnosticResults.databaseCheck.tablesExist).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Tables exist</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Mock Data Sources</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Object.values(diagnosticResults.serviceCheck).filter((s: any) => 
                      s.source === 'hardcoded_mock'
                    ).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Services using mock data</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Non-functional Features</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Object.values(diagnosticResults.functionalityCheck).filter((f: any) => 
                      Object.values(f).some(v => v === false)
                    ).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Features with issues</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Key Issues Identified
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Campaign performance data is hardcoded (not from database)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Campaign settings dialog doesn't persist to database</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Automation rules missing edit functionality</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Email workflow analytics showing static values</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Database Table Status</CardTitle>
                <CardDescription>Check if required CRM tables exist and contain data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(diagnosticResults.databaseCheck.tablesExist).map(([table, exists]) => (
                    <div key={table} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(exists as boolean)}
                        <div>
                          <p className="font-medium">{table}</p>
                          <p className="text-sm text-muted-foreground">
                            {diagnosticResults.databaseCheck.sampleData[table] === 'empty_table' 
                              ? 'Table exists but empty'
                              : typeof diagnosticResults.databaseCheck.sampleData[table] === 'string'
                                ? diagnosticResults.databaseCheck.sampleData[table]
                                : 'Contains data'
                            }
                          </p>
                        </div>
                      </div>
                      <Badge variant={exists ? 'default' : 'destructive'}>
                        {exists ? 'Exists' : 'Missing'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Service Data Sources</CardTitle>
                <CardDescription>Identify which services use real database data vs mock data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(diagnosticResults.serviceCheck).map(([service, info]: [string, any]) => (
                    <div key={service} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{service.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <p className="text-sm text-muted-foreground">
                          {info.count !== undefined ? `${info.count} records` : 'Performance data'}
                        </p>
                      </div>
                      {getSourceBadge(info.source)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="functionality" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Feature Functionality Status</CardTitle>
                <CardDescription>Check if UI components are properly connected to backend operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(diagnosticResults.functionalityCheck).map(([feature, status]: [string, any]) => (
                    <div key={feature} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">{feature.replace(/([A-Z])/g, ' $1').trim()}</h4>
                      <div className="space-y-2">
                        {Object.entries(status).map(([check, working]: [string, any]) => (
                          <div key={check} className="flex items-center gap-2">
                            {working ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm">
                              {check.replace(/([A-Z])/g, ' $1').trim()}: {working ? 'Working' : 'Not Working'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recommended Fixes</CardTitle>
                <CardDescription>Priority actions to resolve identified issues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {diagnosticResults.recommendations.map((recommendation: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <p className="text-sm">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!diagnosticResults && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Run CRM Diagnostics</h3>
              <p className="text-muted-foreground mb-4">
                Click the "Run Diagnostics" button to analyze your CRM system and identify issues.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}