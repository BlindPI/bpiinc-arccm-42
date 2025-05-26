
import { useState } from "react";
import { PublicLayout } from "@/components/PublicLayout";
import { CertificateVerifier } from "@/components/certificates/CertificateVerifier";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QrScanner } from "@/components/certificates/QrScanner";
import { FileText, Search, QrCode, Shield, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function CertificateVerification() {
  const [verificationTab, setVerificationTab] = useState<string>("manual");
  
  const handleQrCodeDetected = (code: string) => {
    toast.success(`QR Code detected: ${code}`);
    setVerificationTab("manual");
  };
  
  return (
    <PublicLayout>
      <div className="container mx-auto py-12 px-4">
        {/* Hero Section */}
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-100 rounded-full">
              <FileText className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Verify Certificate Authenticity
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Instantly verify the authenticity of certificates issued through our platform. 
            Enter the verification code or scan the QR code to confirm validity.
          </p>
        </div>

        {/* Main Verification Section */}
        <div className="max-w-2xl mx-auto mb-16">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-semibold">Certificate Verification Tool</CardTitle>
              <CardDescription className="text-base">
                Choose your preferred verification method below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs 
                value={verificationTab} 
                onValueChange={setVerificationTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="manual" className="flex items-center gap-2 py-3">
                    <Search className="h-4 w-4" />
                    <span className="hidden sm:inline">Manual Entry</span>
                    <span className="sm:hidden">Manual</span>
                  </TabsTrigger>
                  <TabsTrigger value="scan" className="flex items-center gap-2 py-3">
                    <QrCode className="h-4 w-4" />
                    <span className="hidden sm:inline">Scan QR Code</span>
                    <span className="sm:hidden">Scan</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="manual" className="mt-0">
                  <CertificateVerifier />
                </TabsContent>
                
                <TabsContent value="scan" className="mt-0">
                  <Card className="border-0 bg-gray-50">
                    <CardHeader>
                      <CardTitle className="text-lg">Scan Certificate QR Code</CardTitle>
                      <CardDescription>
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

        {/* Information Section */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
          <Card className="p-8 border-0 shadow-md hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm">
            <div className="flex items-center mb-4">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <h3 className="text-xl font-semibold">About Certificate Verification</h3>
            </div>
            <div className="space-y-4 text-gray-600">
              <p>
                All certificates issued by our organization contain a unique verification code and QR code 
                that can be used to confirm their authenticity and validity.
              </p>
              <p>
                This verification system ensures that certificates cannot be forged or tampered with, 
                providing confidence to employers, auditors, and other stakeholders.
              </p>
            </div>
          </Card>

          <Card className="p-8 border-0 shadow-md hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm">
            <div className="flex items-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <h3 className="text-xl font-semibold">What You'll See</h3>
            </div>
            <div className="space-y-3 text-gray-600">
              <p>A valid certificate will display:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Recipient's full name</li>
                <li>Course or certification completed</li>
                <li>Issue date and expiry date</li>
                <li>Current validation status</li>
                <li>Link to view the original certificate</li>
              </ul>
            </div>
          </Card>
        </div>

        {/* Status Examples */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">
            Certificate Status Types
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 border-green-200 bg-green-50 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3">
                <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                <h4 className="font-semibold text-green-800">Valid Certificate</h4>
              </div>
              <p className="text-green-700 text-sm">
                Certificate is authentic, current, and has not expired or been revoked.
              </p>
            </Card>

            <Card className="p-6 border-amber-200 bg-amber-50 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3">
                <AlertTriangle className="h-6 w-6 text-amber-600 mr-2" />
                <h4 className="font-semibold text-amber-800">Expired Certificate</h4>
              </div>
              <p className="text-amber-700 text-sm">
                Certificate was valid but has passed its expiration date and needs renewal.
              </p>
            </Card>

            <Card className="p-6 border-red-200 bg-red-50 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3">
                <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
                <h4 className="font-semibold text-red-800">Invalid/Revoked</h4>
              </div>
              <p className="text-red-700 text-sm">
                Certificate code not found in our system or has been revoked.
              </p>
            </Card>
          </div>
        </div>

        {/* Contact Section */}
        <div className="text-center mt-16 max-w-2xl mx-auto">
          <Card className="p-8 border-0 shadow-md bg-blue-50">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Need Help?</h3>
            <p className="text-gray-600 mb-6">
              If you're having trouble verifying a certificate or believe there's an error, 
              please contact our support team for assistance.
            </p>
            <div className="text-sm text-blue-600 font-medium">
              Support available during business hours
            </div>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
}
