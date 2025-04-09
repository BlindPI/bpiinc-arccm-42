
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, Calendar, User, Book, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

interface VerificationResultProps {
  result: {
    valid: boolean;
    certificate: any;
    status: string;
  } | null;
  isLoading: boolean;
  error: Error | null;
}

export function VerificationResult({ result, isLoading, error }: VerificationResultProps) {
  if (isLoading) {
    return (
      <Card className="mt-6 text-center">
        <CardContent className="pt-6">
          <div className="animate-pulse">
            <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
          <p className="mt-4 text-muted-foreground">Verifying certificate...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-6 border-red-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-red-600 flex items-center">
            <AlertCircle className="mr-2 h-5 w-5" />
            Verification Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            An error occurred while verifying the certificate: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return null;
  }

  const { valid, certificate, status } = result;

  if (!certificate) {
    return (
      <Card className="mt-6 border-red-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-red-600 flex items-center">
            <XCircle className="mr-2 h-5 w-5" />
            Invalid Certificate
          </CardTitle>
          <CardDescription>
            The verification code you entered is not valid
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This certificate could not be found in our system. Please check the verification code and try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  let statusIcon, statusColor, statusText, statusDescription;

  switch (status) {
    case 'ACTIVE':
      statusIcon = <CheckCircle className="mr-2 h-6 w-6" />;
      statusColor = 'text-green-600';
      statusText = 'Valid Certificate';
      statusDescription = 'This certificate is valid and active';
      break;
    case 'EXPIRED':
      statusIcon = <AlertCircle className="mr-2 h-6 w-6" />;
      statusColor = 'text-amber-600';
      statusText = 'Expired Certificate';
      statusDescription = 'This certificate has expired';
      break;
    case 'REVOKED':
      statusIcon = <XCircle className="mr-2 h-6 w-6" />;
      statusColor = 'text-red-600';
      statusText = 'Revoked Certificate';
      statusDescription = 'This certificate has been revoked';
      break;
    default:
      statusIcon = <AlertCircle className="mr-2 h-6 w-6" />;
      statusColor = 'text-gray-600';
      statusText = 'Unknown Status';
      statusDescription = 'The status of this certificate is unknown';
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className={`flex items-center ${statusColor}`}>
          {statusIcon}
          {statusText}
        </CardTitle>
        <CardDescription>
          {statusDescription}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-start">
            <User className="mr-2 h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Recipient</p>
              <p className="text-base">{certificate.recipient_name}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Book className="mr-2 h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Course</p>
              <p className="text-base">{certificate.course_name}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Calendar className="mr-2 h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Issue Date</p>
              <p className="text-base">
                {format(new Date(certificate.issue_date), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Calendar className="mr-2 h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Expiry Date</p>
              <p className="text-base">
                {format(new Date(certificate.expiry_date), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      {certificate.certificate_url && (
        <CardFooter>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.open(certificate.certificate_url, '_blank')}
          >
            <FileText className="mr-2 h-4 w-4" />
            View Certificate
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
