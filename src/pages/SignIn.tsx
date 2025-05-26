
import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoginForm } from '@/components/auth/LoginForm';
import { ArrowLeft, Shield, Lock, CheckCircle2, Users, Award, Globe, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SignIn = () => {
  const { user, loading: authLoading, signIn } = useAuth();
  
  // Redirect authenticated users to dashboard
  if (user && !authLoading) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Show loading state if auth is still initializing
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-xl font-medium text-gray-700">Checking authentication...</h2>
          <p className="mt-2 text-blue-600">Please wait while we verify your session</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Hero Section - Hidden on mobile */}
      <div className="hidden lg:flex flex-col bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-blue-900/20" />
        
        {/* Navigation */}
        <nav className="relative z-10 p-6 flex items-center justify-between">
          <Link to="/landing" className="flex items-center hover:opacity-80 transition-opacity">
            <img
              src="/lovable-uploads/f753d98e-ff80-4947-954a-67f05f34088c.png"
              alt="Assured Response Logo"
              className="h-10 w-auto object-contain brightness-0 invert"
            />
          </Link>
          <Link to="/verification">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
              Verify Certificate
            </Button>
          </Link>
        </nav>

        {/* Hero Content */}
        <div className="flex-1 flex items-center justify-center p-8 relative z-10">
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium mb-8 backdrop-blur-sm">
              <Shield className="h-4 w-4" />
              Secure Access Portal
            </div>
            
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Welcome Back to 
              <span className="text-blue-200 block mt-2">Assured Response</span>
            </h1>
            
            <p className="text-xl text-blue-100 mb-10 leading-relaxed">
              Access your compliance dashboard and manage certifications with confidence. 
              Stay audit-ready with our comprehensive tracking system.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm border border-white/20">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Real-time Tracking</h3>
                <p className="text-blue-100 text-sm">Monitor compliance status across your organization</p>
              </div>
              
              <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm border border-white/20">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Automated Alerts</h3>
                <p className="text-blue-100 text-sm">Never miss certification renewals again</p>
              </div>
              
              <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm border border-white/20">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Team Collaboration</h3>
                <p className="text-blue-100 text-sm">Work seamlessly with providers and instructors</p>
              </div>
              
              <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm border border-white/20">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Canadian Owned</h3>
                <p className="text-blue-100 text-sm">Trusted by 50+ organizations nationwide</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="relative z-10 p-8 border-t border-white/20">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold mb-1">50+</div>
              <div className="text-blue-200 text-sm">Organizations</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">3,000+</div>
              <div className="text-blue-200 text-sm">Certificates</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">99.9%</div>
              <div className="text-blue-200 text-sm">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="flex flex-col bg-gray-50">
        {/* Mobile Navigation */}
        <nav className="lg:hidden border-b bg-white shadow-sm">
          <div className="flex items-center justify-between p-4">
            <Link to="/landing" className="flex items-center hover:opacity-80 transition-opacity">
              <img
                src="/lovable-uploads/f753d98e-ff80-4947-954a-67f05f34088c.png"
                alt="Assured Response Logo"
                className="h-8 w-auto object-contain"
              />
            </Link>
            <Link to="/verification">
              <Button variant="outline" size="sm">
                Verify Certificate
              </Button>
            </Link>
          </div>
        </nav>

        {/* Breadcrumb Navigation */}
        <div className="p-6 lg:p-8 border-b bg-white">
          <nav className="flex items-center space-x-2 text-sm">
            <Link to="/landing" className="text-gray-500 hover:text-gray-700 transition-colors">
              Home
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">Sign In</span>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-lg">
            {/* Mobile Hero */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Shield className="h-4 w-4" />
                Secure Access
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome Back
              </h1>
              <p className="text-gray-600">
                Sign in to access your compliance dashboard
              </p>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Shield className="h-4 w-4" />
                Secure Access Portal
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Sign In to Continue
              </h1>
              <p className="text-xl text-gray-600">
                Access your compliance dashboard and manage certifications
              </p>
            </div>

            {/* Form Card */}
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-semibold">Welcome Back</CardTitle>
                <CardDescription className="text-base">
                  Enter your credentials to access your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <LoginForm onSubmit={signIn} />
                
                {/* Sign up link */}
                <div className="mt-8 text-center">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">New to Assured Response?</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link 
                      to="/auth/signup" 
                      className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
                    >
                      Create your account here →
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trust Indicators */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-xs text-gray-600 font-medium">Secure Login</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Lock className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-xs text-gray-600 font-medium">Encrypted Data</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-xs text-gray-600 font-medium">Privacy Protected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t bg-white py-6 px-6 lg:px-12">
          <div className="grid grid-cols-2 gap-8 items-center max-w-lg mx-auto">
            <div className="text-center">
              <img
                src="/lovable-uploads/f753d98e-ff80-4947-954a-67f05f34088c.png"
                alt="Assured Response Logo"
                className="h-8 w-auto object-contain mx-auto mb-2"
              />
              <p className="text-xs text-gray-500">Assured Response</p>
            </div>
            <div className="text-center">
              <img
                src="/lovable-uploads/ef8ccfd8-f190-4b94-a13f-65150b79dbfe.png"
                alt="BPI Inc. Logo"
                className="h-8 w-auto object-contain mx-auto mb-2"
              />
              <p className="text-xs text-gray-400">Technology by BPI Inc.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default SignIn;
