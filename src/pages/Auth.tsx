
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';

// Updated Hero Section component with improved gradient
const HeroSection = () => <div className="flex flex-col justify-center h-full p-8 md:p-12 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
    <div className="max-w-xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-bold mb-6">
        Certification Compliance
        <span className="text-primary block mt-2">Made Simple.</span>
      </h1>
      <h2 className="text-2xl md:text-3xl font-semibold mb-8">Stay Audit-Ready, Always.</h2>
      
      <p className="text-lg mb-8 text-gray-200">
        Assured Response CCM automates compliance tracking, simplifies certification workflows, and keeps your team prepared for inspections – so you can focus on what matters most.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
        <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Instant Compliance Visibility</h3>
          <p className="text-gray-300">Track certifications, licenses, and training statuses in real-time across your organization.</p>
        </div>
        
        <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Avoid Costly Audit Surprises</h3>
          <p className="text-gray-300">Automated alerts for expiring documents and actionable insights to close compliance gaps.</p>
        </div>
        
        <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Built for Teams</h3>
          <p className="text-gray-300">Collaborate seamlessly with authorized providers, instructors, and auditors in one secure platform.</p>
        </div>
      </div>
    </div>
  </div>;

// Updated Legal Disclosure component
const LegalDisclosure = () => <div className="text-xs text-gray-500 space-y-4 mt-6">
    <Separator className="mb-6" />
    <div className="grid grid-cols-2 gap-4 items-center mb-6">
      <div className="text-center">
        <img src="/lovable-uploads/f753d98e-ff80-4947-954a-67f05f34088c.png" alt="Assured Response Logo" className="h-8 w-auto object-contain mx-auto mb-2" />
        <span className="text-xs font-medium text-gray-600">Assured Response</span>
      </div>
      <div className="text-center">
        <img src="/lovable-uploads/ef8ccfd8-f190-4b94-a13f-65150b79dbfe.png" alt="BPI Inc. Logo" className="h-8 w-auto object-contain mx-auto mb-2" />
        <span className="block text-xs text-gray-500">Technology Provider</span>
      </div>
    </div>
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
  </div>;

// Updated Auth component with modern gradients
const Auth = () => {
  const { user, signIn, signUp } = useAuth();
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Hero Section */}
      <div className="hidden lg:block bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden">
        <div className="h-full flex items-center">
          <HeroSection />
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12 bg-white">
        <div className="sm:mx-auto sm:w-full sm:max-w-[460px]">
          {/* Logo and Welcome */}
          <div className="text-center mb-8">
            <img src="/lovable-uploads/f753d98e-ff80-4947-954a-67f05f34088c.png" alt="Assured Response Logo" className="h-14 w-auto object-contain mx-auto mb-4" style={{
            minWidth: '180px'
          }} />
            <h2 className="text-2xl font-semibold text-gray-900">Welcome to Assured Response</h2>
            <p className="mt-2 text-sm text-gray-600">
              Manage your compliance certifications efficiently
            </p>
          </div>

          <Card className="shadow-md border border-gray-200 rounded-xl overflow-hidden">
            <AuthHeader />
            <CardContent className="pb-8">
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-50/80 p-1 rounded-lg">
                  <TabsTrigger value="signin" className="rounded-md py-2.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="rounded-md py-2.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Sign Up
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="signin" className="mt-0">
                  <LoginForm onSubmit={signIn} />
                </TabsContent>
                <TabsContent value="signup" className="mt-0">
                  <SignupForm onSubmit={signUp} />
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex flex-col pt-0">
              <LegalDisclosure />
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Mobile Hero Section - Simplified for mobile */}
      <div className="lg:hidden bg-gradient-to-br from-gray-900 to-gray-800 py-10 px-4">
        <div className="text-center text-white">
          <h1 className="text-3xl font-bold mb-4">
            Certification Compliance
            <span className="text-primary block mt-2">Made Simple.</span>
          </h1>
          <p className="text-gray-200">
            Automate compliance tracking and stay audit-ready.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
