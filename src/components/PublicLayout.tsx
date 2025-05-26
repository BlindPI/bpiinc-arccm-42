
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Search, LogIn, UserPlus, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30">
      {/* Navigation Header */}
      <nav className="border-b bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/landing" className="flex items-center hover:opacity-80 transition-opacity">
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
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              to="/verification" 
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                isActive('/verification') ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              Verify Certificate
            </Link>
            <div className="flex items-center gap-3">
              <Link to="/verification">
                <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-200">
                  <Search className="h-4 w-4 mr-2" />
                  Verify
                </Button>
              </Link>
              <Link to="/auth/signin">
                <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-200">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
              <Link to="/auth/signup">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-md">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Get Started
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white/95 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-4 space-y-3">
              <Link 
                to="/verification" 
                className="block text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Verify Certificate
              </Link>
              <div className="flex flex-col gap-2">
                <Link to="/verification" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Search className="h-4 w-4 mr-2" />
                    Verify Certificate
                  </Button>
                </Link>
                <Link to="/auth/signin" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth/signup" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button size="sm" className="w-full justify-start bg-blue-600 hover:bg-blue-700">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 mt-20">
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
}
