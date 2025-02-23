
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HeroSection } from '@/components/marketing/HeroSection';
import { Separator } from '@/components/ui/separator';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';

const LegalDisclosure = () => (
  <div className="text-xs text-gray-500 space-y-4 mt-6">
    <Separator />
    <p className="leading-relaxed">
      BPI Inc. has developed and licensed this application to Assured Response to enhance its service delivery. 
      By accessing this platform, users agree to Assured Response's terms of service, privacy policy, and data 
      practices outlined in their agreements.
    </p>
    <p className="leading-relaxed">
      BPI Inc. provides the underlying technology and infrastructure, ensuring robust security and compliance 
      with industry standards. All user data processed through this app is managed by Assured Response in 
      accordance with their policies.
    </p>
    <p className="leading-relaxed">
      For inquiries related to account management, data usage, or support, please contact Assured Response directly. 
      BPI Inc. remains the exclusive software provider and is not responsible for content or services administered 
      by the licensee.
    </p>
  </div>
);

const Auth = () => {
  try {
    const { user, signIn, signUp } = useAuth();

    if (user) {
      return <Navigate to="/" replace />;
    }

    return (
      <div className="min-h-screen grid lg:grid-cols-2">
        {/* Left side - Hero Section */}
        <div className="hidden lg:block bg-[#F3F3F3] overflow-hidden">
          <div className="h-full flex items-center">
            <HeroSection />
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12 bg-white">
          <div className="sm:mx-auto sm:w-full sm:max-w-[460px]">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <img 
                src="/lovable-uploads/f753d98e-ff80-4947-954a-67f05f34088c.png" 
                alt="Assured Response Logo" 
                className="h-12 w-auto object-contain"
                style={{ minWidth: '160px' }}
              />
            </div>

            <Card className="shadow-none border-0">
              <AuthHeader />
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
                    <LoginForm onSubmit={signIn} />
                  </TabsContent>
                  <TabsContent value="signup">
                    <SignupForm onSubmit={signUp} />
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex flex-col">
                <div className="text-sm text-gray-500 border-t pt-6 text-center">
                  Protected by Supabase Auth
                </div>
                <LegalDisclosure />
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Mobile Hero Section */}
        <div className="lg:hidden bg-[#F3F3F3]">
          <HeroSection />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Auth Component Error:', error);
    return <div>Loading...</div>;
  }
};

export default Auth;
