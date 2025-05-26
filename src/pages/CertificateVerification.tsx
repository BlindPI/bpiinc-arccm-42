
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CertificateVerifier } from "@/components/certificates/CertificateVerifier";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QrScanner } from "@/components/certificates/QrScanner";
import { FileText, Search, QrCode, Shield, CheckCircle, AlertTriangle, Home, HelpCircle, Clock, Globe, Award, Users } from "lucide-react";
import { toast } from "sonner";

export default function CertificateVerification() {
  const [verificationTab, setVerificationTab] = useState<string>("manual");
  
  const handleQrCodeDetected = (code: string) => {
    toast.success(`QR Code detected: ${code}`);
    setVerificationTab("manual");
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30">
      {/* Simplified breadcrumb navigation - no duplicate header */}
      <div className="border-b bg-white/90 backdrop-blur-sm">
        <div className="container mx-auto px-4 lg:px-6 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link to="/landing" className="text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1 hover-scale">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">Certificate Verification</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Hero Section with animations */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-8 hover-scale">
              <Shield className="h-4 w-4" />
              Public Verification Tool
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Verify Certificate
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 block mt-2">
                Authenticity
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Instantly verify the authenticity of certificates issued through our platform. 
              Enter the verification code or scan the QR code to confirm validity and view detailed information.
            </p>
            
            {/* Quick Stats with hover animations */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto mb-12">
              <div className="text-center hover-scale">
                <div className="text-3xl font-bold text-blue-600 mb-1">3,000+</div>
                <div className="text-gray-600 text-sm">Certificates Verified</div>
              </div>
              <div className="text-center hover-scale">
                <div className="text-3xl font-bold text-green-600 mb-1">&lt; 1s</div>
                <div className="text-gray-600 text-sm">Verification Time</div>
              </div>
              <div className="text-center hover-scale">
                <div className="text-3xl font-bold text-purple-600 mb-1">24/7</div>
                <div className="text-gray-600 text-sm">Available</div>
              </div>
              <div className="text-center hover-scale">
                <div className="text-3xl font-bold text-orange-600 mb-1">Free</div>
                <div className="text-gray-600 text-sm">Always</div>
              </div>
            </div>
          </div>

          {/* Main Content Grid with improved animations */}
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {/* Verification Tool */}
            <div className="lg:col-span-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm h-full hover:shadow-2xl transition-all duration-300">
                <CardHeader className="text-center pb-6 bg-gradient-to-r from-white to-blue-50/30 rounded-t-lg">
                  <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">
                    Certificate Verification Tool
                  </CardTitle>
                  <CardDescription className="text-lg text-gray-600">
                    Choose your preferred verification method below
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <Tabs 
                    value={verificationTab} 
                    onValueChange={setVerificationTab}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2 mb-8 h-14">
                      <TabsTrigger value="manual" className="flex items-center gap-3 py-4 text-base transition-all duration-200">
                        <Search className="h-5 w-5" />
                        <span>Manual Entry</span>
                      </TabsTrigger>
                      <TabsTrigger value="scan" className="flex items-center gap-3 py-4 text-base transition-all duration-200">
                        <QrCode className="h-5 w-5" />
                        <span>Scan QR Code</span>
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="manual" className="mt-0">
                      <div className="max-w-md mx-auto">
                        <CertificateVerifier />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="scan" className="mt-0">
                      <Card className="border-0 bg-gray-50 max-w-md mx-auto">
                        <CardHeader>
                          <CardTitle className="text-xl flex items-center gap-2">
                            <QrCode className="h-5 w-5" />
                            Scan Certificate QR Code
                          </CardTitle>
                          <CardDescription className="text-base">
                            Position the QR code within your camera's view to scan automatically
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <QrScanner 
                            onCodeDetected={handleQrCodeDetected} 
                            className="w-full rounded-lg overflow-hidden" 
                          />
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Information Panel */}
            <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {/* How It Works */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-blue-600" />
                    How It Works
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Enter Code</h4>
                      <p className="text-gray-600 text-xs">Input the 10-character verification code from the certificate</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Instant Check</h4>
                      <p className="text-gray-600 text-xs">Our system validates the code against our secure database</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">View Results</h4>
                      <p className="text-gray-600 text-xs">Get detailed information about the certificate's status</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security Features */}
              <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    Security Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Encrypted verification codes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Tamper-proof certificates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Real-time status updates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Audit trail logging</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link to="/landing">
                    <Button variant="outline" className="w-full justify-start hover:bg-blue-50 transition-all duration-200">
                      <Home className="h-4 w-4 mr-2" />
                      Back to Home
                    </Button>
                  </Link>
                  <Link to="/auth/signup">
                    <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700 transition-all duration-200">
                      <Users className="h-4 w-4 mr-2" />
                      Create Account
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Status Types Section with staggered animations */}
          <div className="mb-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Certificate Status Types
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Understanding what each verification result means for certificate validity
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-8 border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-lg transition-all duration-300 hover-scale">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-green-800 mb-4">Valid Certificate</h3>
                  <p className="text-green-700 leading-relaxed">
                    Certificate is authentic, current, and has not expired or been revoked. 
                    All information displayed is verified and accurate.
                  </p>
                </div>
              </Card>

              <Card className="p-8 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 hover:shadow-lg transition-all duration-300 hover-scale">
                <div className="text-center">
                  <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-amber-800 mb-4">Expired Certificate</h3>
                  <p className="text-amber-700 leading-relaxed">
                    Certificate was valid but has passed its expiration date. 
                    Contact the certificate holder about renewal requirements.
                  </p>
                </div>
              </Card>

              <Card className="p-8 border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 hover:shadow-lg transition-all duration-300 hover-scale">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-red-800 mb-4">Invalid/Revoked</h3>
                  <p className="text-red-700 leading-relaxed">
                    Certificate code not found in our system, has been revoked, 
                    or may be fraudulent. Exercise caution.
                  </p>
                </div>
              </Card>
            </div>
          </div>

          {/* Support Section */}
          <Card className="shadow-xl border-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:shadow-2xl transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <CardContent className="p-12 text-center">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold mb-6">Need Additional Support?</h2>
                <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                  If you're having trouble verifying a certificate or believe there's an error, 
                  our support team is here to help. We provide assistance during business hours 
                  and maintain comprehensive documentation.
                </p>
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center hover-scale">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="font-semibold mb-2">Business Hours</h4>
                    <p className="text-blue-200 text-sm">Monday - Friday, 9 AM - 5 PM EST</p>
                  </div>
                  <div className="text-center hover-scale">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Globe className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="font-semibold mb-2">Canadian Support</h4>
                    <p className="text-blue-200 text-sm">Local team with regional expertise</p>
                  </div>
                  <div className="text-center hover-scale">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="font-semibold mb-2">Expert Help</h4>
                    <p className="text-blue-200 text-sm">Dedicated compliance specialists</p>
                  </div>
                </div>
                <Link to="/auth/signup">
                  <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100 hover-scale transition-all duration-200">
                    Create Account for Full Support
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-center md:text-left">
              <img
                src="/lovable-uploads/f753d98e-ff80-4947-954a-67f05f34088c.png"
                alt="Assured Response Logo"
                className="h-12 w-auto object-contain mx-auto md:mx-0 mb-4 brightness-0 invert"
              />
              <p className="text-gray-300 mb-4">
                Professional certification management and compliance tracking
              </p>
            </div>
            <div className="text-center md:text-right">
              <img
                src="/lovable-uploads/ef8ccfd8-f190-4b94-a13f-65150b79dbfe.png"
                alt="BPI Inc. Logo"
                className="h-10 w-auto object-contain mx-auto md:ml-auto mb-2 brightness-0 invert"
              />
              <p className="text-sm text-gray-400">Technology provided by BPI Inc.</p>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>© 2024 Assured Response. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
