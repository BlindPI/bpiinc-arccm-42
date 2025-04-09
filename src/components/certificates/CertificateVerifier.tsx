
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, XCircle, Calendar, Award } from 'lucide-react';
import { verifyCertificate } from '@/services/certificates/certificateService';
import { format } from 'date-fns';
import { useMutation } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function CertificateVerifier() {
  const [verificationCode, setVerificationCode] = useState('');
  
  const verifyMutation = useMutation({
    mutationFn: async (code: string) => {
      return await verifyCertificate(code);
    }
  });
  
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) return;
    verifyMutation.mutate(verificationCode.toUpperCase());
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-500 bg-green-50 border-green-200';
      case 'EXPIRED':
        return 'text-amber-500 bg-amber-50 border-amber-200';
      case 'REVOKED':
        return 'text-red-500 bg-red-50 border-red-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'EXPIRED':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'REVOKED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" /> Certificate Verification
        </CardTitle>
        <CardDescription>
          Verify the authenticity of a certificate using the verification code
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="verificationCode" className="text-sm font-medium">
              Enter Verification Code
            </label>
            <div className="flex gap-2">
              <Input
                id="verificationCode"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABC12345DE"
                className="flex-1"
                maxLength={10}
              />
              <Button 
                type="submit"
                disabled={verifyMutation.isPending || !verificationCode.trim()}
              >
                Verify
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The verification code is printed on the certificate
            </p>
          </div>
        </form>
        
        {verifyMutation.isPending && (
          <div className="mt-6 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-6 w-2/3" />
          </div>
        )}
        
        {verifyMutation.isSuccess && (
          <div className="mt-6">
            {verifyMutation.data.valid ? (
              <div className="space-y-4">
                <Alert variant="default" className={getStatusColor(verifyMutation.data.certificate.status)}>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(verifyMutation.data.certificate.status)}
                    <AlertTitle>
                      {verifyMutation.data.certificate.status === 'ACTIVE' 
                        ? 'Valid Certificate' 
                        : verifyMutation.data.certificate.status === 'EXPIRED'
                          ? 'Expired Certificate'
                          : 'Revoked Certificate'}
                    </AlertTitle>
                  </div>
                  <AlertDescription>
                    {verifyMutation.data.certificate.status === 'ACTIVE' 
                      ? 'This certificate is valid and authentic.' 
                      : verifyMutation.data.certificate.status === 'EXPIRED'
                        ? 'This certificate has expired.'
                        : 'This certificate has been revoked.'}
                  </AlertDescription>
                </Alert>
                
                <div className="bg-gray-50 p-4 rounded-md space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Recipient</p>
                      <p className="font-medium">{verifyMutation.data.certificate.recipient_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Course</p>
                      <p>{verifyMutation.data.certificate.course_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Issue Date</p>
                      <p className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(verifyMutation.data.certificate.issue_date), 'MMMM d, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Expiry Date</p>
                      <p className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(verifyMutation.data.certificate.expiry_date), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle>Invalid Certificate</AlertTitle>
                <AlertDescription>
                  The verification code you entered is not valid. Please check and try again.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
        
        {verifyMutation.isError && (
          <Alert variant="destructive" className="mt-6">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Verification Error</AlertTitle>
            <AlertDescription>
              An error occurred during verification. Please try again later.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4 text-xs text-muted-foreground">
        This verification tool confirms the authenticity of certificates issued by our organization.
      </CardFooter>
    </Card>
  );
}
