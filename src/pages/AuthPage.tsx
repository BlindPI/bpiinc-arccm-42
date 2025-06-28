
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthPage() {
  const location = useLocation();
  const { signIn, signUp } = useAuth();
  
  // Determine default tab based on route
  const defaultTab = location.pathname === '/auth/signup' ? 'signup' : 'signin';
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4">
              <img
                src="/lovable-uploads/f753d98e-ff80-4947-954a-67f05f34088c.png"
                alt="Assured Response Logo"
                className="h-16 w-auto mx-auto rounded-lg shadow-md bg-white p-2"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Welcome to Assured Response
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Certificate Management System
            </p>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <LoginForm onSubmit={signIn} />
              </TabsContent>
              
              <TabsContent value="signup">
                <SignupForm onSubmit={signUp} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
