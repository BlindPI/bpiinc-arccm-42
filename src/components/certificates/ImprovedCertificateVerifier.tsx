
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { CertificateService } from '@/services/certificates/certificateService';
import { ErrorHandlingService } from '@/services/errorHandlingService';
import { VerificationResult } from './VerificationResult';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ImprovedCertificateVerifier() {
  const [verificationCode, setVerificationCode] = useState('');
  const [formattedCode, setFormattedCode] = useState('');
  
  const verifyMutation = useMutation({
    mutationFn: async (code: string) => {
      const result = await ErrorHandlingService.handleAsyncError(
        () => CertificateService.verifyCertificate(code),
        {
          component: 'CertificateVerifier',
          action: 'verify_certificate'
        }
      );
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      return result.data;
    },
  });
  
  const handleVerify = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!verificationCode.trim()) return;
    
    const cleanCode = verificationCode.replace(/\s/g, '').toUpperCase();
    verifyMutation.mutate(cleanCode);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\s/g, '').toUpperCase();
    setVerificationCode(input);
    
    // Format for display (XXX-00000-XX)
    if (input.length <= 3) {
      setFormattedCode(input);
    } else if (input.length <= 8) {
      setFormattedCode(`${input.slice(0, 3)}-${input.slice(3)}`);
    } else {
      setFormattedCode(`${input.slice(0, 3)}-${input.slice(3, 8)}-${input.slice(8, 10)}`);
    }
  };

  const getStatusIcon = () => {
    if (verifyMutation.isPending) return <Clock className="h-4 w-4 animate-spin" />;
    if (verifyMutation.data?.rateLimited) return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    if (verifyMutation.data?.valid) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (verifyMutation.data?.error) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    return <Search className="h-4 w-4" />;
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Verify Certificate</CardTitle>
          <CardDescription>
            Enter the 10-character verification code found on the certificate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="e.g. ABC12345DE"
                value={formattedCode}
                onChange={handleInputChange}
                className="text-center text-lg tracking-wider"
                maxLength={12}
                disabled={verifyMutation.isPending}
              />
              <p className="text-xs text-muted-foreground text-center">
                Format: XXX-00000-XX
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={verificationCode.length !== 10 || verifyMutation.isPending}
            >
              {verifyMutation.isPending ? 'Verifying...' : 'Verify Certificate'}
              {getStatusIcon()}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Rate limiting warning */}
      {verifyMutation.data?.rateLimited && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Too many verification attempts. Please wait before trying again.
          </AlertDescription>
        </Alert>
      )}
      
      <VerificationResult 
        result={verifyMutation.data || null} 
        isLoading={verifyMutation.isPending}
        error={verifyMutation.error as Error | null}
      />
    </div>
  );
}
