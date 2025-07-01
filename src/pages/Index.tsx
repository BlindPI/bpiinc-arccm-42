
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user) {
        navigate('/dashboard');
      } else {
        navigate('/landing');
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30">
        <div className="text-center animate-fade-in">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-700">Loading...</h2>
          <p className="text-gray-500 mt-2">Please wait while we set up your session</p>
        </div>
      </div>
    );
  }

  return null;
}
