
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { CertificateService } from '@/services/certificates/certificateService';
import { VerificationResult } from './VerificationResult';

export function CertificateVerifier() {
  const [verificationCode, setVerificationCode] = useState('');
  const [formattedCode, setFormattedCode] = useState('');
  
  const verifyMutation = useMutation({
    mutationFn: (code: string) => CertificateService.verifyCertificate(code),
  });
  
  const handleVerify = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!verificationCode.trim()) return;
    
    // Remove any spaces that might have been entered
    const cleanCode = verificationCode.replace(/\s/g, '').toUpperCase();
    verifyMutation.mutate(cleanCode);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\s/g, '').toUpperCase();
    setVerificationCode(input);
    
    // Format the code for display (XXX-00000-XX)
    if (input.length <= 3) {
      setFormattedCode(input);
    } else if (input.length <= 8) {
      setFormattedCode(`${input.slice(0, 3)}-${input.slice(3)}`);
    } else {
      setFormattedCode(`${input.slice(0, 3)}-${input.slice(3, 8)}-${input.slice(8, 10)}`);
    }
  };

  return (
    <div className="max-w-md mx-auto">
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
                maxLength={12} // 10 chars + 2 hyphens
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
              <Search className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <VerificationResult 
        result={verifyMutation.data || null} 
        isLoading={verifyMutation.isPending}
        error={verifyMutation.error as Error | null}
      />
    </div>
  );
}
