import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SSOConfiguration {
  client_id?: string;
  client_secret?: string;
  redirect_uri?: string;
  issuer?: string;
  metadata_url?: string;
}

export function SSOIntegrationManager() {
  const [ssoConfig, setSsoConfig] = useState<SSOConfiguration>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSsoConfig(prevConfig => ({
      ...prevConfig,
      [name]: value
    }));
  };

  const handleSaveConfig = async () => {
    // Validate required fields before saving
    const requiredConfig = {
      client_id: ssoConfig.client_id || '',
      client_secret: ssoConfig.client_secret || '',
      redirect_uri: ssoConfig.redirect_uri || '',
      issuer: ssoConfig.issuer || '',
      metadata_url: ssoConfig.metadata_url || ''
    };

    if (!requiredConfig.client_id || !requiredConfig.client_secret) {
      console.error('Client ID and Client Secret are required');
      return;
    }

    try {
      // Save the configuration with proper typing
      console.log('Saving SSO config:', requiredConfig);
    } catch (error) {
      console.error('Failed to save SSO configuration:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>SSO Integration Manager</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="space-y-2">
          <Label htmlFor="client_id">Client ID</Label>
          <Input
            id="client_id"
            name="client_id"
            value={ssoConfig.client_id || ''}
            onChange={handleChange}
            placeholder="Enter Client ID"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="client_secret">Client Secret</Label>
          <Input
            id="client_secret"
            name="client_secret"
            type="password"
            value={ssoConfig.client_secret || ''}
            onChange={handleChange}
            placeholder="Enter Client Secret"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="redirect_uri">Redirect URI</Label>
          <Input
            id="redirect_uri"
            name="redirect_uri"
            value={ssoConfig.redirect_uri || ''}
            onChange={handleChange}
            placeholder="Enter Redirect URI"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="issuer">Issuer URL</Label>
          <Input
            id="issuer"
            name="issuer"
            value={ssoConfig.issuer || ''}
            onChange={handleChange}
            placeholder="Enter Issuer URL"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="metadata_url">Metadata URL</Label>
          <Input
            id="metadata_url"
            name="metadata_url"
            value={ssoConfig.metadata_url || ''}
            onChange={handleChange}
            placeholder="Enter Metadata URL"
          />
        </div>
        <Button onClick={handleSaveConfig}>Save Configuration</Button>
      </CardContent>
    </Card>
  );
}
