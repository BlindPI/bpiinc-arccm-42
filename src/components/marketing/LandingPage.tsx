
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Enterprise Training Hub
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Streamline your training programs, manage certificates, and track compliance 
              with our comprehensive enterprise solution.
            </p>
            <div className="space-x-4">
              <Link to="/auth/signin">
                <Button size="lg" className="px-8 py-3">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth/signup">
                <Button variant="outline" size="lg" className="px-8 py-3">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-2xl">📚</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Training Management</h3>
              <p className="text-gray-600">
                Organize and deliver training programs with ease
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-2xl">🏆</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Certification Tracking</h3>
              <p className="text-gray-600">
                Issue and manage digital certificates efficiently
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Analytics & Reporting</h3>
              <p className="text-gray-600">
                Get insights into training effectiveness and compliance
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
