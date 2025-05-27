
import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SignupForm } from '@/components/auth/SignupForm';
import { ArrowLeft, UserPlus, Zap, Award, Globe, CheckCircle2, Shield, Lock, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SignUp = () => {
  const { user, loading: authLoading, signUp } = useAuth();
  
  // Redirect authenticated users to dashboard
  if (user && !authLoading) {
    return <Navigate to="/" replace />;
  }
  
  // Show loading state if auth is still initializing
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-xl font-medium text-gray-700">Loading...</h2>
          <p className="mt-2 text-blue-600">Setting up your session...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Hero Section - Hidden on mobile */}
      <div className="hidden lg:flex flex-col bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 via-transparent to-green-900/20" />
        
        {/* Navigation */}
        <nav className="relative z-10 p-6 flex items-center justify-between">
          <Link to="/landing" className="flex items-center hover:opacity-80 transition-opacity">
            <img
              src="/lovable-uploads/f753d98e-ff80-4947-954a-67f05f34088c.png"
              alt="Assured Response Logo"
              className="h-10 w-auto object-contain brightness-0 invert"
            />
          </Link>
          <Link to="/verify">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
              Verify Certificate
            </Button>
          </Link>
        </nav>

        {/* Hero Content */}
        <div className="flex-1 flex items-center justify-center p-8 relative z-10">
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium mb-8 backdrop-blur-sm">
              <Zap className="h-4 w-4" />
              Start Your Journey
            </div>
            
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Join the Future of
              <span className="text-green-200 block mt-2">Compliance Management</span>
            </h1>
            
            <p className="text-xl text-green-100 mb-10 leading-relaxed">
              Transform how your organization handles certifications and compliance. 
              Join hundreds of companies already using our platform.
            </p>

            {/* Benefits List */}
            <div className="space-y-6 mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Get Started in Minutes</h3>
                  <p className="text-green-100">Quick setup with immediate access to all features</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Team Collaboration</h3>
                  <p className="text-green-100">Invite your team and work together seamlessly</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Enterprise Security</h3>
                  <p className="text-green-100">Bank-grade encryption and data protection</p>
                </div>
              </div>
            </div>

            {/* Testimonial */}
            <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm border border-white/20">
              <p className="text-green-100 italic mb-4">
                "Assured Response CCM transformed our compliance workflow. We went from manual tracking 
                to automated alerts and reports in just one week."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold">Sarah Johnson</p>
                  <p className="text-green-200 text-sm">Compliance Manager, TechCorp</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="relative z-10 p-8 border-t border-white/20">
          <div className="text-center">
            <p className="text-green-200 mb-4">Join 50+ organizations already using our platform</p>
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold">Free</div>
                <div className="text-green-200 text-sm">Trial</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">5 Min</div>
                <div className="text-green-200 text-sm">Setup</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">24/7</div>
                <div className="text-green-200 text-sm">Support</div>
              </div>
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
            <Link to="/verify">
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
            <span className="text-gray-900 font-medium">Sign Up</span>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-lg">
            {/* Mobile Hero */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Zap className="h-4 w-4" />
                Get Started Free
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Join Assured Response
              </h1>
              <p className="text-gray-600">
                Create your account to streamline compliance
              </p>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <UserPlus className="h-4 w-4" />
                Start Your Free Trial
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Create Your Account
              </h1>
              <p className="text-xl text-gray-600">
                Join hundreds of organizations streamlining compliance
              </p>
            </div>

            {/* Form Card */}
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-semibold">Get Started Today</CardTitle>
                <CardDescription className="text-base">
                  Create your account and start your free trial
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8">
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

            {/* Benefits Cards */}
            <div className="mt-8 grid grid-cols-1 gap-4">
              <Card className="p-4 border-0 bg-gradient-to-r from-blue-50 to-blue-100/50">
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
              
              <Card className="p-4 border-0 bg-gradient-to-r from-green-50 to-green-100/50">
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

            {/* Trust Indicators */}
            <div className="mt-8 grid grid-cols-3 gap-4">
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

export default SignUp;
