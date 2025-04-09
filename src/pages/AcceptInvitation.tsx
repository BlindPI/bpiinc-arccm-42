
import { useLocation } from 'react-router-dom';
import { AcceptInvitationForm } from '@/components/user-management/AcceptInvitationForm';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AcceptInvitation() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const token = params.get('token');
  
  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Invalid Invitation</AlertTitle>
            <AlertDescription>
              This invitation link is invalid or has expired. Please contact your administrator for a new invitation.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-6">
        <AcceptInvitationForm token={token} />
      </div>
    </div>
  );
}
