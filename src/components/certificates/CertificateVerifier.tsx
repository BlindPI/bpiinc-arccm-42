
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VerificationResult } from './VerificationResult';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CertificateVerifierProps {
  initialVerificationCode?: string;
}

export function CertificateVerifier({ initialVerificationCode = "" }: CertificateVerifierProps) {
  const [verificationCode, setVerificationCode] = useState<string>(initialVerificationCode);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<any | null>(null);
  
  useEffect(() => {
    if (initialVerificationCode) {
      setVerificationCode(initialVerificationCode);
      if (initialVerificationCode.length >= 6) {
        handleVerify();
      }
    }
  }, [initialVerificationCode]);

  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      toast.error('Please enter a verification code');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setResult(null);

      // Call the Supabase function to verify the certificate
      const { data, error } = await supabase
        .rpc('verify_certificate', { verification_code: verificationCode.trim() });

      if (error) throw new Error(error.message);

      if (!data || data.length === 0) {
        setResult({
          valid: false,
          certificate: null,
          status: 'NOT_FOUND'
        });
        return;
      }

      setResult({
        valid: data[0].valid,
        certificate: {
          id: data[0].certificate_id,
          recipient_name: data[0].recipient_name,
          course_name: data[0].course_name,
          issue_date: data[0].issue_date,
          expiry_date: data[0].expiry_date,
        },
        status: data[0].status
      });

    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err);
      toast.error(`Verification failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Enter Certificate Verification Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verification-code">Verification Code</Label>
              <div className="flex space-x-2">
                <Input
                  id="verification-code"
                  placeholder="e.g. ABC12345XY"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="flex-1"
                  autoComplete="off"
                />
                <Button 
                  onClick={handleVerify} 
                  disabled={isLoading || !verificationCode.trim()}
                >
                  {isLoading ? (
                    <>Verifying...</>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Verify
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Enter the verification code found on the certificate
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <VerificationResult 
        result={result} 
        isLoading={isLoading} 
        error={error} 
      />
    </div>
  );
}
