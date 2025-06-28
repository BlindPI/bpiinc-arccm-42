
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Shield, Users, BookOpen } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="mx-auto mb-8">
            <img
              src="/lovable-uploads/f753d98e-ff80-4947-954a-67f05f34088c.png"
              alt="Assured Response Logo"
              className="h-20 w-auto mx-auto rounded-lg shadow-md bg-white p-3"
            />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Assured Response
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Comprehensive Certificate Management System for training organizations
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/auth/signin">
              <Button size="lg" className="px-8">
                Sign In
              </Button>
            </Link>
            <Link to="/auth/signup">
              <Button size="lg" variant="outline" className="px-8">
                Get Started
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <Award className="h-10 w-10 text-blue-600 mb-4" />
              <CardTitle>Certificate Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Streamline certificate creation, tracking, and verification
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-green-600 mb-4" />
              <CardTitle>Compliance Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Monitor compliance requirements and maintain audit trails
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-purple-600 mb-4" />
              <CardTitle>Team Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Organize teams, assign roles, and track progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BookOpen className="h-10 w-10 text-orange-600 mb-4" />
              <CardTitle>Training Hub</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Manage courses, enrollments, and learning paths
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
