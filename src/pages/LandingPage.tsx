
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Shield, Users, Clock, Search, LogIn, UserPlus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30">
      {/* Navigation Header */}
      <nav className="border-b bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center">
            <img
              src="/lovable-uploads/f753d98e-ff80-4947-954a-67f05f34088c.png"
              alt="Assured Response Logo"
              className="h-9 w-auto object-contain"
              style={{ minWidth: '110px' }}
            />
            <Separator orientation="vertical" className="mx-4 h-8" />
            <div className="hidden md:flex flex-col">
              <h1 className="text-lg font-semibold text-gray-800 tracking-tight">
                Certificate Management System
              </h1>
              <span className="text-xs text-blue-600 font-medium">
                Compliance Made Simple
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link to="/verification">
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Verify Certificate
              </Button>
            </Link>
            <Link to="/auth/signin">
              <Button variant="outline" size="sm">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </Link>
            <Link to="/auth/signup">
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Certification Compliance
              <span className="text-blue-600 block mt-2">Made Simple.</span>
            </h1>
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-700 mb-8">
              Stay Audit-Ready, Always.
            </h2>
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Assured Response CCM automates compliance tracking, simplifies certification workflows, 
              and keeps your team prepared for inspections – so you can focus on what matters most.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/signup">
                <Button size="lg" className="text-lg px-8 py-6">
                  Start Free Trial
                </Button>
              </Link>
              <Link to="/verification">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  <Search className="h-5 w-5 mr-2" />
                  Verify a Certificate
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Assured Response CCM?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Transform your compliance management with our comprehensive solution
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 border-2 hover:border-blue-200 transition-colors">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl font-semibold">Instant Compliance Visibility</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-600 leading-relaxed">
                  Track certifications, licenses, and training statuses in real-time across your organization. 
                  Get instant insights into compliance gaps and upcoming renewals.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="p-8 border-2 hover:border-blue-200 transition-colors">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl font-semibold">Avoid Costly Audit Surprises</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-600 leading-relaxed">
                  Automated alerts for expiring documents and actionable insights to close compliance gaps. 
                  Stay ahead of audits with proactive monitoring.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="p-8 border-2 hover:border-blue-200 transition-colors">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl font-semibold">Built for Teams</CardTitle>
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

      {/* Certificate Verification Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Verify Certificates Instantly
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Quickly verify the authenticity of any certificate issued through our platform
          </p>
          <div className="flex justify-center">
            <Link to="/verification">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                <Search className="h-5 w-5 mr-2" />
                Start Verification
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Streamline Your Compliance?
          </h2>
          <p className="text-xl mb-10 text-blue-100">
            Join hundreds of organizations already using Assured Response CCM to stay audit-ready
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Get Started Free
              </Button>
            </Link>
            <Link to="/auth/signin">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-blue-600">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-center md:text-left">
              <img
                src="/lovable-uploads/f753d98e-ff80-4947-954a-67f05f34088c.png"
                alt="Assured Response Logo"
                className="h-12 w-auto object-contain mx-auto md:mx-0 mb-4"
              />
              <p className="text-gray-300 mb-4">
                Professional certification management and compliance tracking
              </p>
            </div>
            <div className="text-center md:text-right">
              <img
                src="/lovable-uploads/ef8ccfd8-f190-4b94-a13f-65150b79dbfe.png"
                alt="BPI Inc. Logo"
                className="h-10 w-auto object-contain mx-auto md:ml-auto mb-2"
              />
              <p className="text-sm text-gray-400">Technology provided by BPI Inc.</p>
            </div>
          </div>
          <Separator className="my-8 bg-gray-700" />
          <div className="text-center text-sm text-gray-400">
            <p>© 2024 Assured Response. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
