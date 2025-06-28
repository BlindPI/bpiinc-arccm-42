
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Users, BarChart3 } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
              Enterprise Compliance Platform
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Streamline your compliance management with our comprehensive platform designed for modern organizations.
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <Button size="lg" onClick={() => navigate('/auth/signin')}>
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Secure & Compliant</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Enterprise-grade security with comprehensive compliance management
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Team Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Efficient team oversight with role-based access controls
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Advanced Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Real-time insights and comprehensive reporting capabilities
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
