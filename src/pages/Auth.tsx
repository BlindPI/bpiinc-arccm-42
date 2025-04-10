
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  try {
    const { user, signIn, signUp } = useAuth();
    const [activeTab, setActiveTab] = useState('signin');
    const [formData, setFormData] = useState({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      organization: '',
      termsAccepted: false,
      rememberMe: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (user) {
      return <Navigate to="/" replace />;
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    };

    const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
        await signIn(formData.email, formData.password);
      } catch (error) {
        console.error('Sign in error:', error);
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!formData.termsAccepted) {
        alert('Please accept the terms and conditions');
        return;
      }
      
      setIsSubmitting(true);
      try {
        await signUp(formData.email, formData.password);
      } catch (error) {
        console.error('Sign up error:', error);
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleSocialLogin = async (provider: 'google' | 'microsoft') => {
      try {
        await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/`
          }
        });
      } catch (error) {
        console.error(`${provider} login error:`, error);
      }
    };

    const toggleTab = (tab: string) => {
      setActiveTab(tab);
    };

    return (
      <div className="min-h-screen">
        <div className="flex flex-col lg:flex-row min-h-screen">
          {/* Left side - Hero Section */}
          <div className="hidden lg:flex lg:w-1/2 hero-gradient flex-col justify-between p-8 text-white">
            <div className="mt-8">
              <img src="https://assurednewseo.netlify.app/index_files/First+Aid+and+CPR+Training.jpg" alt="First Aid Training" className="mb-8 rounded-xl shadow-lg max-w-md mx-auto" />
              <h1 className="text-4xl font-bold mb-2">Certification Compliance Management</h1>
              <p className="text-xl opacity-90 mb-8">Ontario's trusted solution for tracking, managing and ensuring compliance for First Aid & CPR certification.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-filter backdrop-blur-sm">
                  <div className="rounded-full w-12 h-12 flex items-center justify-center feature-icon mb-4">
                    <i className="fas fa-shield-alt text-xl"></i>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">WSIB Approved</h3>
                  <p className="opacity-90">Fully compliant with all Workplace Safety & Insurance Board requirements.</p>
                </div>
                
                <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-filter backdrop-blur-sm">
                  <div className="rounded-full w-12 h-12 flex items-center justify-center feature-icon mb-4">
                    <i className="fas fa-calendar-check text-xl"></i>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Expiry Tracking</h3>
                  <p className="opacity-90">Automated reminders for certification renewals and refresher courses.</p>
                </div>
                
                <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-filter backdrop-blur-sm">
                  <div className="rounded-full w-12 h-12 flex items-center justify-center feature-icon mb-4">
                    <i className="fas fa-file-alt text-xl"></i>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Audit-Ready Reports</h3>
                  <p className="opacity-90">Generate compliance reports for regulatory inspections instantly.</p>
                </div>
                
                <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-filter backdrop-blur-sm">
                  <div className="rounded-full w-12 h-12 flex items-center justify-center feature-icon mb-4">
                    <i className="fas fa-users text-xl"></i>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Team Management</h3>
                  <p className="opacity-90">Oversee compliance status for your entire organization at a glance.</p>
                </div>
              </div>
            </div>
            
            <div className="mt-12 mb-6">
              <p className="text-sm opacity-75 mb-2">Trusted by organizations across Ontario:</p>
              <div className="flex flex-wrap items-center gap-8">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apple/apple-original.svg" alt="Company" className="h-8 w-auto partner-logo" />
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" alt="Company" className="h-8 w-auto partner-logo" />
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/facebook/facebook-original.svg" alt="Company" className="h-8 w-auto partner-logo" />
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg" alt="Company" className="h-8 w-auto partner-logo" />
              </div>
            </div>
          </div>
          
          {/* Right side - Auth Form */}
          <div className="flex flex-col justify-center items-center px-4 py-12 lg:w-1/2 bg-white print-full-width">
            <div className="w-full max-w-md mx-auto">
              {/* Logo and Welcome */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-6">
                  <div className="bg-red-600 h-10 w-10 rounded-l-lg flex items-center justify-center">
                    <i className="fas fa-heartbeat text-white text-xl"></i>
                  </div>
                  <div className="bg-gray-800 h-10 px-3 rounded-r-lg flex items-center justify-center">
                    <span className="text-white font-bold">Assured Response CCM</span>
                  </div>
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                <p className="text-gray-600">
                  Access your certification management dashboard
                </p>
              </div>
              
              {/* Auth Card */}
              <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Security Badge */}
                <div className="bg-green-50 border-b border-green-100 px-4 py-2 flex items-center justify-center text-green-700 text-sm">
                  <i className="fas fa-lock mr-2"></i> Secure authentication powered by Supabase Auth
                </div>
                
                {/* Auth Tabs */}
                <div className="flex border-b">
                  <button 
                    className={`w-1/2 py-4 font-medium text-center text-sm transition focus:outline-none ${activeTab === 'signin' ? 'tab-active' : 'tab-inactive'}`}
                    onClick={() => toggleTab('signin')}
                  >
                    Sign In
                  </button>
                  <button 
                    className={`w-1/2 py-4 font-medium text-center text-sm transition focus:outline-none ${activeTab === 'signup' ? 'tab-active' : 'tab-inactive'}`}
                    onClick={() => toggleTab('signup')}
                  >
                    Create Account
                  </button>
                </div>
                
                {/* Sign In Form */}
                <div className={`p-8 ${activeTab === 'signin' ? '' : 'hidden'}`}>
                  <form onSubmit={handleSignIn}>
                    <div className="mb-5">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <i className="fas fa-envelope text-gray-400"></i>
                        </div>
                        <input 
                          type="email" 
                          id="email" 
                          name="email" 
                          className="pl-10 input-focus w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none transition" 
                          placeholder="you@example.com" 
                          value={formData.email}
                          onChange={handleInputChange}
                          required 
                        />
                      </div>
                    </div>
                    
                    <div className="mb-5">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <i className="fas fa-lock text-gray-400"></i>
                        </div>
                        <input 
                          type="password" 
                          id="password" 
                          name="password" 
                          className="pl-10 input-focus w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none transition" 
                          placeholder="••••••••" 
                          value={formData.password}
                          onChange={handleInputChange}
                          required 
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="rememberMe" 
                          name="rememberMe" 
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          checked={formData.rememberMe}
                          onChange={handleInputChange}
                        />
                        <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                          Remember me
                        </label>
                      </div>
                      <a href="#" className="text-sm font-medium text-red-600 hover:text-red-500">
                        Forgot password?
                      </a>
                    </div>
                    
                    <button 
                      type="submit" 
                      className="brand-primary button-hover w-full py-3 text-white font-medium rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Signing In...' : 'Sign In'}
                    </button>
                  </form>
                  
                  <div className="mt-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or continue with</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mt-6">
                      <button 
                        type="button" 
                        className="flex justify-center items-center py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        onClick={() => handleSocialLogin('google')}
                      >
                        <i className="fab fa-google text-red-500 mr-2"></i>
                        <span className="text-sm font-medium text-gray-700">Google</span>
                      </button>
                      <button 
                        type="button" 
                        className="flex justify-center items-center py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        onClick={() => handleSocialLogin('microsoft')}
                      >
                        <i className="fab fa-microsoft text-blue-500 mr-2"></i>
                        <span className="text-sm font-medium text-gray-700">Microsoft</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Sign Up Form */}
                <div className={`p-8 ${activeTab === 'signup' ? '' : 'hidden'}`}>
                  <form onSubmit={handleSignUp}>
                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <input 
                          type="text" 
                          id="firstName" 
                          name="firstName" 
                          className="input-focus w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none transition" 
                          placeholder="John" 
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required 
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <input 
                          type="text" 
                          id="lastName" 
                          name="lastName" 
                          className="input-focus w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none transition" 
                          placeholder="Doe" 
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required 
                        />
                      </div>
                    </div>
                    
                    <div className="mb-5">
                      <label htmlFor="signupEmail" className="block text-sm font-medium text-gray-700 mb-1">Work Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <i className="fas fa-envelope text-gray-400"></i>
                        </div>
                        <input 
                          type="email" 
                          id="signupEmail" 
                          name="email" 
                          className="pl-10 input-focus w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none transition" 
                          placeholder="you@company.com" 
                          value={formData.email}
                          onChange={handleInputChange}
                          required 
                        />
                      </div>
                    </div>
                    
                    <div className="mb-5">
                      <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <i className="fas fa-building text-gray-400"></i>
                        </div>
                        <input 
                          type="text" 
                          id="organization" 
                          name="organization" 
                          className="pl-10 input-focus w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none transition" 
                          placeholder="Your Company" 
                          value={formData.organization}
                          onChange={handleInputChange}
                          required 
                        />
                      </div>
                    </div>
                    
                    <div className="mb-5">
                      <label htmlFor="signupPassword" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <i className="fas fa-lock text-gray-400"></i>
                        </div>
                        <input 
                          type="password" 
                          id="signupPassword" 
                          name="password" 
                          className="pl-10 input-focus w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none transition" 
                          placeholder="••••••••" 
                          value={formData.password}
                          onChange={handleInputChange}
                          required 
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters with 1 uppercase, 1 number & 1 special character</p>
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex items-start">
                        <input 
                          type="checkbox" 
                          id="termsAccepted" 
                          name="termsAccepted" 
                          className="h-4 w-4 mt-1 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          checked={formData.termsAccepted}
                          onChange={handleInputChange}
                          required
                        />
                        <label htmlFor="termsAccepted" className="ml-2 block text-sm text-gray-700">
                          I agree to the <a href="#" className="text-red-600 hover:text-red-500">Terms of Service</a> and <a href="#" className="text-red-600 hover:text-red-500">Privacy Policy</a>
                        </label>
                      </div>
                    </div>
                    
                    <button 
                      type="submit" 
                      className="brand-primary button-hover w-full py-3 text-white font-medium rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creating Account...' : 'Create Account'}
                    </button>
                  </form>
                </div>
                
                {/* Footer */}
                <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg" alt="Microsoft Azure" className="h-5 w-auto mr-2" />
                      <span className="text-xs text-gray-500">Hosted on Microsoft Azure</span>
                    </div>
                    <div className="flex items-center">
                      <i className="fas fa-shield-alt text-green-600 mr-2"></i>
                      <span className="text-xs text-gray-500">SOC 2 Compliant</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    <p className="mb-2">
                      © 2023 Assured Response. All rights reserved. Certified by the Workplace Safety and Insurance Board (WSIB) of Ontario.
                    </p>
                    <p>
                      By accessing this platform, you agree to Assured Response's <a href="#" className="text-red-600 hover:underline">Terms of Service</a>, <a href="#" className="text-red-600 hover:underline">Privacy Policy</a>, and <a href="#" className="text-red-600 hover:underline">Data Processing Agreement</a>.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Mobile Features Section (visible only on mobile) */}
              <div className="lg:hidden mt-12 space-y-6">
                <h3 className="text-xl font-bold text-center text-gray-900 mb-4">Why Choose Assured Response CCM?</h3>
                
                <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
                  <div className="flex items-center mb-3">
                    <div className="rounded-full w-10 h-10 flex items-center justify-center bg-red-100 text-red-600 mr-3">
                      <i className="fas fa-shield-alt"></i>
                    </div>
                    <h4 className="font-semibold text-gray-900">WSIB Approved Platform</h4>
                  </div>
                  <p className="text-gray-600 text-sm">Fully compliant with all Workplace Safety & Insurance Board requirements for Ontario businesses.</p>
                </div>
                
                <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
                  <div className="flex items-center mb-3">
                    <div className="rounded-full w-10 h-10 flex items-center justify-center bg-red-100 text-red-600 mr-3">
                      <i className="fas fa-bell"></i>
                    </div>
                    <h4 className="font-semibold text-gray-900">Automated Reminders</h4>
                  </div>
                  <p className="text-gray-600 text-sm">Never miss a certification renewal with our smart notification system.</p>
                </div>
                
                <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
                  <div className="flex items-center mb-3">
                    <div className="rounded-full w-10 h-10 flex items-center justify-center bg-red-100 text-red-600 mr-3">
                      <i className="fas fa-file-alt"></i>
                    </div>
                    <h4 className="font-semibold text-gray-900">Compliance Reporting</h4>
                  </div>
                  <p className="text-gray-600 text-sm">Generate comprehensive reports for regulatory inspections with a single click.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Auth Component Error:', error);
    return <div>Loading...</div>;
  }
};

export default Auth;
