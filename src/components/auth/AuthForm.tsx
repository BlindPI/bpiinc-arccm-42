
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FormData {
  email: string;
  password: string;
}

interface AuthFormProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
}

export function AuthForm({ onSignIn, onSignUp }: AuthFormProps) {
  const [formData, setFormData] = useState<FormData>({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, isSignUp: boolean) => {
    e.preventDefault();
    if (isSignUp) {
      await onSignUp(formData.email, formData.password);
    } else {
      await onSignIn(formData.email, formData.password);
    }
  };

  const AuthFormFields = ({ isSignUp }: { isSignUp: boolean }) => {
    const formPrefix = isSignUp ? 'signup' : 'signin';
    
    return (
      <form onSubmit={(e) => handleSubmit(e, isSignUp)} className="space-y-4">
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

  return (
    <Tabs defaultValue="signin" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="signin">Sign In</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>
      <TabsContent value="signin">
        <AuthFormFields isSignUp={false} />
      </TabsContent>
      <TabsContent value="signup">
        <AuthFormFields isSignUp={true} />
      </TabsContent>
    </Tabs>
  );
}
