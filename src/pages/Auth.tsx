
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

interface FormData {
  email: string;
  password: string;
}

const AuthForm = ({ 
  isSignUp, 
  onSubmit 
}: { 
  isSignUp: boolean;
  onSubmit: (email: string, password: string) => Promise<void>;
}) => {
  const [formData, setFormData] = useState<FormData>({ email: '', password: '' });
  const formPrefix = isSignUp ? 'signup' : 'signin';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit(formData.email, formData.password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${formPrefix}-email`}>Email</Label>
        <Input
          id={`${formPrefix}-email`}
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          required
          autoComplete={isSignUp ? 'off' : 'email'}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${formPrefix}-password`}>Password</Label>
        <Input
          id={`${formPrefix}-password`}
          type="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          required
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          className="h-11"
        />
      </div>
      <Button type="submit" className="w-full h-11">
        {isSignUp ? 'Create Account' : 'Sign In'}
      </Button>
    </form>
  );
};

const Auth = () => {
  try {
    const { user, signIn, signUp } = useAuth();

    if (user) {
      return <Navigate to="/" replace />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Start managing your compliance certifications efficiently
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <AuthForm isSignUp={false} onSubmit={signIn} />
              </TabsContent>
              <TabsContent value="signup">
                <AuthForm isSignUp={true} onSubmit={signUp} />
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-gray-600">
            Protected by Supabase Auth
          </CardFooter>
        </Card>
      </div>
    );
  } catch (error) {
    console.error('Auth Component Error:', error);
    return <div>Loading...</div>;
  }
};

export default Auth;
