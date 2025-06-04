
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, Calendar, User, Book, Shield, MapPin, Building, Award, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  const { data: locationData } = useQuery({
    queryKey: ['certificate-location', result?.certificate?.location_id],
    queryFn: async () => {
      if (!result?.certificate?.location_id) return null;
      
      const { data, error } = await supabase
        .from('locations')
        .select('name, address, city, state, phone, email, website')
        .eq('id', result.certificate.location_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!result?.certificate?.location_id
  });

  if (isLoading) {
    return (
      <Card className="mt-6 text-center border-0 shadow-lg">
        <CardContent className="pt-8 pb-8">
          <div className="animate-pulse">
            <div className="h-16 w-16 bg-blue-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Shield className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
          <p className="mt-6 text-lg font-medium text-blue-600">Verifying certificate authenticity...</p>
          <p className="text-sm text-muted-foreground">Please wait while we validate the certificate</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-6 border-red-200 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-red-600 text-xl">Verification Error</CardTitle>
          <CardDescription className="text-base">
            Unable to complete certificate verification at this time
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 font-medium">Technical Error</p>
            <p className="text-red-600 text-sm mt-1">{error.message}</p>
          </div>
          <p className="text-muted-foreground mt-4">
            Please try again later or contact support if the problem persists.
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
      <Card className="mt-6 border-red-200 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-red-600 text-xl">Certificate Not Found</CardTitle>
          <CardDescription className="text-base">
            The verification code you entered could not be located in our system
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 font-medium">Invalid Verification Code</p>
            <p className="text-red-600 text-sm mt-1">
              This certificate code is not valid or does not exist in our records.
            </p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-gray-700 font-medium">What to check:</p>
            <ul className="text-gray-600 text-sm mt-2 space-y-1">
              <li>• Ensure the code is entered exactly as shown on the certificate</li>
              <li>• Verify the code format: XXX-00000-XX (3 letters, 5 numbers, 2 letters)</li>
              <li>• Contact the certificate holder if you suspect an error</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Determine status and styling
  let actualStatus = status;
  let statusIcon, statusColor, statusText, statusDescription, cardBorderClass;

  if (!status || status === 'UNKNOWN' || status === 'VALID') {
    const currentDate = new Date();
    const expiryDate = new Date(certificate.expiry_date);
    
    if (expiryDate < currentDate) {
      actualStatus = 'EXPIRED';
    } else if (certificate.status === 'REVOKED') {
      actualStatus = 'REVOKED';
    } else if (certificate.status === 'ACTIVE') {
      actualStatus = 'ACTIVE';
    } else {
      actualStatus = 'ACTIVE';
    }
  }

  switch (actualStatus.toUpperCase()) {
    case 'ACTIVE':
    case 'VALID':
      statusIcon = <CheckCircle className="h-8 w-8" />;
      statusColor = 'text-green-600';
      statusText = 'Valid Certificate';
      statusDescription = 'This certificate is authentic, current, and verified';
      cardBorderClass = 'border-green-200';
      break;
    case 'EXPIRED':
      statusIcon = <Clock className="h-8 w-8" />;
      statusColor = 'text-amber-600';
      statusText = 'Expired Certificate';
      statusDescription = 'This certificate was valid but has now expired';
      cardBorderClass = 'border-amber-200';
      break;
    case 'REVOKED':
      statusIcon = <XCircle className="h-8 w-8" />;
      statusColor = 'text-red-600';
      statusText = 'Revoked Certificate';
      statusDescription = 'This certificate has been officially revoked';
      cardBorderClass = 'border-red-200';
      break;
    default:
      statusIcon = <AlertCircle className="h-8 w-8" />;
      statusColor = 'text-gray-600';
      statusText = 'Unknown Status';
      statusDescription = 'Unable to determine certificate status';
      cardBorderClass = 'border-gray-200';
  }

  return (
    <Card className={`mt-6 shadow-xl ${cardBorderClass}`}>
      {/* Header with Status */}
      <CardHeader className="text-center pb-4 bg-gradient-to-br from-white to-gray-50">
        <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
          actualStatus === 'ACTIVE' ? 'bg-green-100' : 
          actualStatus === 'EXPIRED' ? 'bg-amber-100' : 'bg-red-100'
        }`}>
          <span className={statusColor}>{statusIcon}</span>
        </div>
        <CardTitle className={`text-2xl font-bold ${statusColor}`}>
          {statusText}
        </CardTitle>
        <CardDescription className="text-base">
          {statusDescription}
        </CardDescription>
        <Badge 
          variant={actualStatus === 'ACTIVE' ? 'default' : 'secondary'}
          className={`mt-2 ${
            actualStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
            actualStatus === 'EXPIRED' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
          }`}
        >
          Status: {actualStatus}
        </Badge>
      </CardHeader>

      {/* Certificate Details */}
      <CardContent className="space-y-6 p-6">
        {/* Recipient Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Certificate Holder
          </h3>
          <div className="space-y-2">
            <div className="flex items-start">
              <User className="mr-3 h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Name</p>
                <p className="text-lg font-semibold text-blue-900">{certificate.recipient_name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Course Information */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center">
            <Book className="h-5 w-5 mr-2" />
            Training Details
          </h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <Book className="mr-3 h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-purple-800">Course Completed</p>
                <p className="text-lg font-semibold text-purple-900">{certificate.course_name}</p>
              </div>
            </div>
            {certificate.instructor_name && (
              <div className="flex items-start">
                <User className="mr-3 h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-purple-800">Instructor</p>
                  <p className="text-base text-purple-900">{certificate.instructor_name}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start">
              <Calendar className="mr-3 h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-800">Issue Date</p>
                <p className="text-base font-semibold text-gray-900">
                  {format(new Date(certificate.issue_date), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start">
              <Calendar className="mr-3 h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-800">Expiry Date</p>
                <p className="text-base font-semibold text-gray-900">
                  {format(new Date(certificate.expiry_date), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Location Information */}
        {locationData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Issuing Location
            </h3>
            <div className="space-y-2">
              <div className="flex items-start">
                <Building className="mr-3 h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Training Center</p>
                  <p className="text-base font-semibold text-blue-900">{locationData.name}</p>
                  {locationData.address && (
                    <p className="text-sm text-blue-700">
                      {locationData.address}, {locationData.city}, {locationData.state}
                    </p>
                  )}
                </div>
              </div>
              {(locationData.phone || locationData.email) && (
                <div className="text-sm text-blue-700 mt-2">
                  {locationData.phone && <p>Phone: {locationData.phone}</p>}
                  {locationData.email && <p>Email: {locationData.email}</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Verification Code Display */}
        <div className="bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Verification Details
          </h3>
          <div className="bg-white rounded border p-3">
            <p className="text-sm font-medium text-gray-600">Verification Code</p>
            <p className="text-xl font-mono font-bold text-gray-900 tracking-wider">
              {certificate.verification_code}
            </p>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Verified on {format(new Date(), 'MMMM d, yyyy \'at\' h:mm a')}
          </p>
        </div>
      </CardContent>

      {/* Footer with Branding */}
      <CardFooter className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-b-lg">
        <div className="w-full text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Shield className="h-5 w-5" />
            <span className="text-lg font-bold">Assured Response Training & Consulting</span>
          </div>
          <p className="text-blue-100 text-sm">
            WSIB Approved Training Provider | Secure Certificate Verification System
          </p>
          <p className="text-blue-200 text-xs">
            This verification was performed using our secure authentication system. 
            For questions about this certificate, please contact the issuing location.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}
