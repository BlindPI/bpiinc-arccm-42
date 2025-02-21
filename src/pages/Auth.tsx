
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Auth = () => {
  const { user, signIn, signUp } = useAuth();
  const [signInData, setSignInData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({ email: '', password: '' });

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, isSignUp: boolean) => {
    e.preventDefault();
    const { email, password } = isSignUp ? signUpData : signInData;
    if (isSignUp) {
      await signUp(email, password);
    } else {
      await signIn(email, password);
    }
  };

  const AuthForm = ({ isSignUp }: { isSignUp: boolean }) => {
    const { email, password } = isSignUp ? signUpData : signInData;
    const setData = isSignUp
      ? (data: typeof signUpData) => setSignUpData(data)
      : (data: typeof signInData) => setSignInData(data);

    return (
      <form onSubmit={(e) => handleSubmit(e, isSignUp)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${isSignUp ? 'signup' : 'signin'}-email`}>Email</Label>
          <Input
            id={`${isSignUp ? 'signup' : 'signin'}-email`}
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setData({ ...signInData, email: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${isSignUp ? 'signup' : 'signin'}-password`}>Password</Label>
          <Input
            id={`${isSignUp ? 'signup' : 'signin'}-password`}
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setData({ ...signInData, password: e.target.value })}
            required
          />
        </div>
        <Button type="submit" className="w-full">
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </Button>
      </form>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>Sign in or create a new account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <AuthForm isSignUp={false} />
            </TabsContent>
            <TabsContent value="signup">
              <AuthForm isSignUp={true} />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-gray-600">
          Protected by Supabase Auth
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;

