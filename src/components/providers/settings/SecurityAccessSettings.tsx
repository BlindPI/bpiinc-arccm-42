import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Shield, Key, Clock, Database, AlertTriangle } from 'lucide-react';
import { useProviderSettings } from '@/hooks/useProviderSettings';
import { TooltipInfo } from '@/components/ui/tooltip-info';
import { DataExportRequest } from './DataExportRequest';

export function SecurityAccessSettings() {
  const { settings, updateSecurity, isUpdating } = useProviderSettings();
  const [securitySettings, setSecuritySettings] = React.useState({
    session_timeout_minutes: 480,
    two_factor_enabled: false,
    api_access_enabled: false,
    certificate_data_retention_days: 2555, // ~7 years
    batch_processing_retention_days: 1095, // 3 years
    communication_records_retention_days: 730, // 2 years
    personal_data_retention_days: 2555, // ~7 years
    audit_trail_retention_days: 365, // 1 year
    assessment_data_retention_days: 2555, // ~7 years
  });

  React.useEffect(() => {
    if (settings) {
      setSecuritySettings({
        session_timeout_minutes: settings.session_timeout_minutes || 480,
        two_factor_enabled: settings.two_factor_enabled || false,
        api_access_enabled: settings.api_access_enabled || false,
        certificate_data_retention_days: settings.certificate_data_retention_days || 2555,
        batch_processing_retention_days: settings.batch_processing_retention_days || 1095,
        communication_records_retention_days: settings.communication_records_retention_days || 730,
        personal_data_retention_days: settings.personal_data_retention_days || 2555,
        audit_trail_retention_days: settings.audit_trail_retention_days || 365,
        assessment_data_retention_days: settings.assessment_data_retention_days || 2555,
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSecurity(securitySettings);
  };

  const updateSetting = (field: string, value: any) => {
    setSecuritySettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Authentication & Security
            </CardTitle>
            <CardDescription>
              Configure security settings and authentication options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Session Timeout</Label>
              <Select 
                value={securitySettings.session_timeout_minutes.toString()} 
                onValueChange={(value) => updateSetting('session_timeout_minutes', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="240">4 hours</SelectItem>
                  <SelectItem value="480">8 hours</SelectItem>
                  <SelectItem value="720">12 hours</SelectItem>
                  <SelectItem value="1440">24 hours</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-muted-foreground">
                How long to keep you logged in during inactivity
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <div className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </div>
              </div>
              <Switch
                checked={securitySettings.two_factor_enabled}
                onCheckedChange={(checked) => updateSetting('two_factor_enabled', checked)}
              />
            </div>

            {securitySettings.two_factor_enabled && (
              <div className="ml-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Setup Required</span>
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  Two-factor authentication is enabled but not yet configured. Please contact your system administrator to complete the setup.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Access
            </CardTitle>
            <CardDescription>
              Control API access and integration permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable API Access</Label>
                <div className="text-sm text-muted-foreground">
                  Allow external applications to access your data via API
                </div>
              </div>
              <Switch
                checked={securitySettings.api_access_enabled}
                onCheckedChange={(checked) => updateSetting('api_access_enabled', checked)}
              />
            </div>

            {securitySettings.api_access_enabled && (
              <div className="ml-4 space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Key className="h-4 w-4" />
                    <span className="font-medium">API Configuration</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    API access is enabled. Contact your system administrator to generate API keys and configure permissions.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Retention Settings
            </CardTitle>
            <CardDescription>
              Configure how long different types of data are retained in the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Certificate Data Retention */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Certificate Data Retention</Label>
                <TooltipInfo content="Certificate requests, recipient names, scores, completion dates, instructor details. Recommended: 7 years for compliance." />
              </div>
              <Select 
                value={securitySettings.certificate_data_retention_days.toString()} 
                onValueChange={(value) => updateSetting('certificate_data_retention_days', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1095">3 years</SelectItem>
                  <SelectItem value="1825">5 years</SelectItem>
                  <SelectItem value="2555">7 years (Recommended)</SelectItem>
                  <SelectItem value="3650">10 years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Batch Processing Retention */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Batch Processing Data</Label>
                <TooltipInfo content="Batch IDs, batch names, bulk upload records, processing logs. Used for tracking bulk operations and troubleshooting." />
              </div>
              <Select 
                value={securitySettings.batch_processing_retention_days.toString()} 
                onValueChange={(value) => updateSetting('batch_processing_retention_days', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="730">2 years</SelectItem>
                  <SelectItem value="1095">3 years (Recommended)</SelectItem>
                  <SelectItem value="1825">5 years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assessment Data Retention */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Assessment Data</Label>
                <TooltipInfo content="Practical/written scores, completion dates, pass/fail status. Critical for certification validation and appeals." />
              </div>
              <Select 
                value={securitySettings.assessment_data_retention_days.toString()} 
                onValueChange={(value) => updateSetting('assessment_data_retention_days', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1095">3 years</SelectItem>
                  <SelectItem value="1825">5 years</SelectItem>
                  <SelectItem value="2555">7 years (Recommended)</SelectItem>
                  <SelectItem value="3650">10 years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Personal Data Retention */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Personal Data</Label>
                <TooltipInfo content="Recipient emails, phone numbers, addresses, employment information. Subject to GDPR and privacy regulations." />
              </div>
              <Select 
                value={securitySettings.personal_data_retention_days.toString()} 
                onValueChange={(value) => updateSetting('personal_data_retention_days', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1095">3 years</SelectItem>
                  <SelectItem value="1825">5 years</SelectItem>
                  <SelectItem value="2555">7 years (Recommended)</SelectItem>
                  <SelectItem value="3650">10 years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Communication Records */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Communication Records</Label>
                <TooltipInfo content="Email notifications, batch communications, status updates. Used for tracking communications and troubleshooting delivery issues." />
              </div>
              <Select 
                value={securitySettings.communication_records_retention_days.toString()} 
                onValueChange={(value) => updateSetting('communication_records_retention_days', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="730">2 years (Recommended)</SelectItem>
                  <SelectItem value="1095">3 years</SelectItem>
                  <SelectItem value="1825">5 years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Audit Trail Retention */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Audit Trail</Label>
                <TooltipInfo content="System access logs, setting changes, administrative actions. Required for security monitoring and compliance audits." />
              </div>
              <Select 
                value={securitySettings.audit_trail_retention_days.toString()} 
                onValueChange={(value) => updateSetting('audit_trail_retention_days', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">6 months</SelectItem>
                  <SelectItem value="365">1 year (Recommended)</SelectItem>
                  <SelectItem value="730">2 years</SelectItem>
                  <SelectItem value="1095">3 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <DataExportRequest />

        <Button type="submit" disabled={isUpdating} className="w-full">
          {isUpdating ? 'Saving Security Settings...' : 'Save Security Settings'}
        </Button>
      </form>
    </div>
  );
}