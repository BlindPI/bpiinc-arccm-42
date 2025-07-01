
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Shield, Users, Clock, Search, LogIn, UserPlus, ArrowRight, Star, Zap, Globe, Award } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-30 transition-all duration-200">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/landing" className="hover:opacity-80 transition-opacity">
              <img
                src="/lovable-uploads/f753d98e-ff80-4947-954a-67f05f34088c.png"
                alt="Assured Response Logo"
                className="h-9 w-auto object-contain rounded bg-white shadow-sm"
                style={{ minWidth: '110px' }}
              />
            </Link>
            <div className="hidden md:flex flex-col ml-4">
              <h1 className="text-lg font-semibold text-gray-800 tracking-tight">
                Certificate Management System
              </h1>
              <span className="text-xs text-blue-600 font-medium">
                Public Access
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link to="/auth/signin">
              <Button 
                variant="outline" 
                size="sm" 
                className="hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
              >
                Sign In
              </Button>
            </Link>
            <Link to="/auth/signup">
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700 shadow-md transition-all duration-200 hover:shadow-lg"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-blue-400/5" />
        <div className="container mx-auto max-w-6xl relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fade-in">
              <Zap className="h-4 w-4" />
              Trusted by 50+ Organizations
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight animate-fade-in">
              Certification Compliance
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 block mt-2">
                Made Simple.
              </span>
            </h1>
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-700 mb-8 animate-fade-in">
              Stay Audit-Ready, Always.
            </h2>
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in">
              Assured Response CCM automates compliance tracking, simplifies certification workflows, 
              and keeps your team prepared for inspections – so you can focus on what matters most.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
              <Link to="/auth/signup">
                <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  Get Started
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link to="/verify">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300">
                  <Search className="h-5 w-5 mr-2" />
                  Verify a Certificate
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Award className="h-4 w-4" />
              Industry Leading Features
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose Assured Response CCM?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Transform your compliance management with our comprehensive solution
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="group p-8 border-2 border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-white to-blue-50/30">
              <CardHeader className="text-center pb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold">Instant Compliance Visibility</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-600 leading-relaxed">
                  Track certifications, licenses, and training statuses in real-time across your organization. 
                  Get instant insights into compliance gaps and upcoming renewals.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group p-8 border-2 border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-white to-green-50/30">
              <CardHeader className="text-center pb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Shield className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold">Avoid Costly Audit Surprises</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-600 leading-relaxed">
                  Automated alerts for expiring documents and actionable insights to close compliance gaps. 
                  Stay ahead of audits with proactive monitoring and reporting.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group p-8 border-2 border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-white to-purple-50/30">
              <CardHeader className="text-center pb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Users className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold">Built for Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-600 leading-relaxed">
                  Collaborate seamlessly with authorized providers, instructors, and auditors in one secure platform. 
                  Streamline workflows across your entire organization.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="container mx-auto max-w-6xl relative">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="group">
              <div className="text-4xl md:text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">50+</div>
              <div className="text-blue-100 font-medium">Organizations Trust Us</div>
            </div>
            <div className="group">
              <div className="text-4xl md:text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">3,000+</div>
              <div className="text-blue-100 font-medium">Certificates Issued</div>
            </div>
            <div className="group">
              <div className="text-4xl md:text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">99.9%</div>
              <div className="text-blue-100 font-medium">Uptime Guarantee</div>
            </div>
            <div className="group">
              <div className="text-4xl md:text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">Canadian</div>
              <div className="text-blue-100 font-medium">Owned and Operated</div>
            </div>
          </div>
        </div>
      </section>

      {/* Certificate Verification Section */}
      <section className="py-20 px-4 bg-gray-50 relative">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Globe className="h-4 w-4" />
            Public Verification
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Verify Certificates Instantly
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Quickly verify the authenticity of any certificate issued through our platform. 
            No account required - completely free and instant.
          </p>
          <div className="flex justify-center mb-8">
            <Link to="/verify">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 shadow-md hover:shadow-lg">
                <Search className="h-5 w-5 mr-2" />
                Start Verification
              </Button>
            </Link>
          </div>
          
          {/* Verification Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-2">Instant Results</h4>
              <p className="text-gray-600 text-sm">Get verification results in seconds</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold mb-2">Secure & Reliable</h4>
              <p className="text-gray-600 text-sm">Bank-grade security and encryption</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold mb-2">Globally Accessible</h4>
              <p className="text-gray-600 text-sm">Available 24/7 from anywhere</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20" />
        <div className="container mx-auto max-w-4xl text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Star className="h-4 w-4" />
            Join the Best
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Streamline Your Compliance?
          </h2>
          <p className="text-xl mb-10 text-gray-200 max-w-2xl mx-auto">
            Join hundreds of organizations already using Assured Response CCM to stay audit-ready and compliant
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6 bg-white text-gray-900 hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                Get Started
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link to="/auth/signin">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-white text-white hover:bg-white hover:text-gray-900 transition-all duration-300">
                <LogIn className="h-5 w-5 mr-2" />
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
