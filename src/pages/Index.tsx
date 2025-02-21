
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Navigate } from 'react-router-dom';

const Index = () => {
  const { user, signOut, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold mb-4">Welcome to Certificate Management</h1>
        <p className="text-xl text-gray-600">Logged in as: {user.email}</p>
        <Button onClick={signOut} variant="outline">Sign Out</Button>
      </div>
    </div>
  );
};

export default Index;
