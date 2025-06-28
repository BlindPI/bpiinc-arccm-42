
import React from 'react';
import { Link } from 'react-router-dom';
import { EnhancedButton } from '@/design-system/components/atoms/EnhancedButton';
import { CardLayout } from '@/design-system/components/molecules/CardLayout';
import { BarChart3, Users, Shield, Zap } from 'lucide-react';

export function LandingPage() {
  const features = [
    {
      icon: Users,
      title: 'Team Management',
      description: 'Organize and manage your teams with powerful collaboration tools'
    },
    {
      icon: Shield,
      title: 'Compliance Tracking',
      description: 'Stay compliant with automated tracking and reporting'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Get insights with comprehensive analytics and reporting'
    },
    {
      icon: Zap,
      title: 'Automation',
      description: 'Streamline workflows with intelligent automation'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">TH</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Training Hub</span>
          </div>
          <div className="flex space-x-4">
            <Link to="/auth/signin">
              <EnhancedButton variant="ghost">Sign In</EnhancedButton>
            </Link>
            <Link to="/auth/signup">
              <EnhancedButton variant="primary">Get Started</EnhancedButton>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Enterprise Training Management Made Simple
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Streamline your organization's training, compliance, and team management 
            with our comprehensive enterprise platform.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/auth/signup">
              <EnhancedButton variant="primary" size="lg">
                Start Free Trial
              </EnhancedButton>
            </Link>
            <EnhancedButton variant="secondary" size="lg">
              Schedule Demo
            </EnhancedButton>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need to manage training
            </h2>
            <p className="text-lg text-gray-600">
              Powerful features designed for enterprise-scale operations
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <CardLayout key={index} className="text-center" padding="lg">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </CardLayout>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
