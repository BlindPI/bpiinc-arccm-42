
import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SignupForm } from '@/components/auth/SignupForm';
import { ArrowLeft, UserPlus, Zap, Award, Globe, CheckCircle2, Shield, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SignUp = () => {
  const { user, loading: authLoading, signUp } = useAuth();
  
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-blue-400/5" />
      
      {/* Navigation Header */}
      <nav className="relative z-10 border-b bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <Link to="/landing" className="flex items-center hover:opacity-80 transition-opacity">
            <img
              src="/lovable-uploads/f753d98e-ff80-4947-954a-67f05f34088c.png"
              alt="Assured Response Logo"
              className="h-9 w-auto object-contain"
              style={{ minWidth: '110px' }}
            />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/verification">
              <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-200">
                Verify Certificate
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex flex-col justify-center py-12 px-4 relative">
        <div className="sm:mx-auto sm:w-full sm:max-w-md relative">
          {/* Back to home link */}
          <div className="mb-6 animate-fade-in">
            <Link to="/landing">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-blue-50/50 transition-all duration-300">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Logo and Welcome */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Get Started Free
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Join Assured Response
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Create your account to get started
            </p>
            <p className="text-sm text-gray-500">
              Streamline compliance and stay audit-ready
            </p>
          </div>

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 animate-fade-in">
            <CardHeader className="text-center pb-6 bg-gradient-to-br from-white to-green-50/30 rounded-t-lg">
              <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
                Create Your Account
              </CardTitle>
              <CardDescription className="text-base text-gray-600">
                Join hundreds of organizations already using our platform
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <SignupForm onSubmit={signUp} />
              
              {/* Sign in link */}
              <div className="mt-8 text-center">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">Already have an account?</span>
                  </div>
                </div>
                <div className="mt-4">
                  <Link 
                    to="/auth/signin" 
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
                  >
                    Sign in here →
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <div className="mt-8 grid grid-cols-1 gap-4 animate-fade-in">
            <Card className="p-4 border-0 bg-gradient-to-r from-blue-50 to-blue-100/50 hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">Instant Compliance Visibility</h4>
                  <p className="text-xs text-gray-600">Track certifications in real-time</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 border-0 bg-gradient-to-r from-green-50 to-green-100/50 hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">Avoid Audit Surprises</h4>
                  <p className="text-xs text-gray-600">Automated alerts and insights</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Trust indicators */}
          <div className="mt-8 grid grid-cols-3 gap-4 animate-fade-in">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-xs text-gray-600 font-medium">Free Trial</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Lock className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-xs text-gray-600 font-medium">Secure Setup</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Globe className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-xs text-gray-600 font-medium">Canadian Owned</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t bg-white/95 backdrop-blur-sm py-6 px-4 mt-auto">
        <div className="container mx-auto max-w-2xl">
          <div className="grid grid-cols-2 gap-8 items-center">
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
        </div>
      </footer>
    </div>
  );
};

export default SignUp;
