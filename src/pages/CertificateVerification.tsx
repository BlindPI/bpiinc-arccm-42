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
  return <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6 hover-scale">
          <Shield className="h-4 w-4" />
          Public Verification Tool
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          Verify Certificate
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 block mt-2">
            Authenticity
          </span>
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          Instantly verify the authenticity of certificates issued through our platform. 
          Enter the verification code or scan the QR code to confirm validity and view detailed information.
        </p>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-lg mx-auto mb-8">
          <div className="text-center hover-scale">
            <div className="text-2xl font-bold text-blue-600 mb-1">3,000+</div>
            <div className="text-gray-600 text-xs">Certificates Verified</div>
          </div>
          <div className="text-center hover-scale">
            <div className="text-2xl font-bold text-green-600 mb-1">&lt; 1s</div>
            <div className="text-gray-600 text-xs">Verification Time</div>
          </div>
          <div className="text-center hover-scale">
            <div className="text-2xl font-bold text-purple-600 mb-1">24/7</div>
            <div className="text-gray-600 text-xs">Available</div>
          </div>
          <div className="text-center hover-scale">
            <div className="text-2xl font-bold text-orange-600 mb-1">Free</div>
            <div className="text-gray-600 text-xs">Always</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6 mb-12">
        {/* Verification Tool */}
        <div className="lg:col-span-2 animate-fade-in" style={{
        animationDelay: '0.1s'
      }}>
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm h-full hover:shadow-2xl transition-all duration-300">
            <CardHeader className="text-center pb-4 bg-gradient-to-r from-white to-blue-50/30 rounded-t-lg">
              <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
                Certificate Verification Tool
              </CardTitle>
              <CardDescription className="text-base text-gray-600">
                Choose your preferred verification method below
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs value={verificationTab} onValueChange={setVerificationTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
                  <TabsTrigger value="manual" className="flex items-center gap-2 py-3 text-sm transition-all duration-200">
                    <Search className="h-4 w-4" />
                    <span>Manual Entry</span>
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
                      <CardTitle className="text-lg flex items-center gap-2">
                        <QrCode className="h-4 w-4" />
                        Scan Certificate QR Code
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Position the QR code within your camera's view to scan automatically
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <QrScanner onCodeDetected={handleQrCodeDetected} className="w-full rounded-lg overflow-hidden" />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Information Panel */}
        <div className="space-y-4 animate-fade-in" style={{
        animationDelay: '0.2s'
      }}>
          {/* How It Works */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-blue-600" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-xs">Enter Code</h4>
                  <p className="text-gray-600 text-xs">Input the 10-character verification code</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-xs">Instant Check</h4>
                  <p className="text-gray-600 text-xs">System validates against secure database</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-xs">View Results</h4>
                  <p className="text-gray-600 text-xs">Get detailed certificate information</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Features */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                Security Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span className="text-xs">Encrypted verification codes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span className="text-xs">Tamper-proof certificates</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span className="text-xs">Real-time status updates</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span className="text-xs">Audit trail logging</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/landing">
                <Button variant="outline" size="sm" className="w-full justify-start hover:bg-blue-50 transition-all duration-200">
                  <Home className="h-3 w-3 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <Link to="/auth/signup">
                <Button size="sm" className="w-full justify-start bg-blue-600 hover:bg-blue-700 transition-all duration-200">
                  <Users className="h-3 w-3 mr-2" />
                  Create Account
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Types Section */}
      <div className="mb-12 animate-fade-in" style={{
      animationDelay: '0.3s'
    }}>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Certificate Status Types
          </h2>
          <p className="text-base text-gray-600 max-w-xl mx-auto">
            Understanding what each verification result means for certificate validity
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-lg transition-all duration-300 hover-scale">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-green-800 mb-3">Valid Certificate</h3>
              <p className="text-green-700 text-sm leading-relaxed">
                Certificate is authentic, current, and has not expired or been revoked. 
                All information displayed is verified and accurate.
              </p>
            </div>
          </Card>

          <Card className="p-6 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 hover:shadow-lg transition-all duration-300 hover-scale">
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-amber-800 mb-3">Expired Certificate</h3>
              <p className="text-amber-700 text-sm leading-relaxed">
                Certificate was valid but has passed its expiration date. 
                Contact the certificate holder about renewal requirements.
              </p>
            </div>
          </Card>

          <Card className="p-6 border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 hover:shadow-lg transition-all duration-300 hover-scale">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-red-800 mb-3">Invalid/Revoked</h3>
              <p className="text-red-700 text-sm leading-relaxed">
                Certificate code not found in our system, has been revoked, 
                or may be fraudulent. Exercise caution.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Support Section */}
      <Card className="shadow-xl border-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:shadow-2xl transition-all duration-300 animate-fade-in" style={{
      animationDelay: '0.4s'
    }}>
        <CardContent className="p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Need Additional Support?</h2>
            <p className="text-lg text-blue-100 mb-6 leading-relaxed">
              If you're having trouble verifying a certificate or believe there's an error, 
              our support team is here to help during business hours.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="text-center hover-scale">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-semibold mb-1 text-sm">Business Hours</h4>
                <p className="text-blue-200 text-xs">Monday - Friday, 9 AM - 5 PM EST</p>
              </div>
              <div className="text-center hover-scale">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Globe className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-semibold mb-1 text-sm">Canadian Support</h4>
                <p className="text-blue-200 text-xs">Local team with regional expertise</p>
              </div>
              <div className="text-center hover-scale">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-semibold mb-1 text-sm">Expert Help</h4>
                <p className="text-blue-200 text-xs">Dedicated compliance specialists</p>
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
    </div>;
}