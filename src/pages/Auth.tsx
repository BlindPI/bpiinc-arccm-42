
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { HeroSection } from '@/components/marketing/HeroSection';

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${formPrefix}-email`} className="text-sm font-medium text-gray-700">
            Email Address
          </Label>
          <Input
            id={`${formPrefix}-email`}
            type="email"
            placeholder="Enter your business email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
            autoComplete={isSignUp ? 'off' : 'email'}
            className="h-12 text-base bg-white border-gray-300 focus:border-primary/80 focus:ring-primary/20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${formPrefix}-password`} className="text-sm font-medium text-gray-700">
            Password
          </Label>
          <Input
            id={`${formPrefix}-password`}
            type="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            required
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            className="h-12 text-base bg-white border-gray-300 focus:border-primary/80 focus:ring-primary/20"
          />
        </div>
      </div>
      <Button 
        type="submit" 
        className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 transition-colors"
      >
        {isSignUp ? 'Get Started' : 'Sign In'}
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
      <div className="min-h-screen bg-[#F3F3F3]">
        <HeroSection />
        
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <Card className="w-full max-w-[460px] shadow-lg border-0">
            <CardHeader className="text-center space-y-2 pb-6">
              <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
                Welcome to Assured Response
              </CardTitle>
              <CardDescription className="text-base text-gray-600">
                Manage your compliance certifications efficiently
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 p-1 rounded-lg">
                  <TabsTrigger 
                    value="signin"
                    className="rounded-md py-2.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup"
                    className="rounded-md py-2.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="signin">
                  <AuthForm isSignUp={false} onSubmit={signIn} />
                </TabsContent>
                <TabsContent value="signup">
                  <AuthForm isSignUp={true} onSubmit={signUp} />
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-center text-sm text-gray-500 border-t pt-6">
              Protected by Supabase Auth
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Auth Component Error:', error);
    return <div>Loading...</div>;
  }
};

export default Auth;
