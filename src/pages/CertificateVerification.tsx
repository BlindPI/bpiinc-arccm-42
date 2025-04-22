
import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CertificateVerifier } from "@/components/certificates/CertificateVerifier";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QrScanner } from "@/components/certificates/QrScanner";
import { PageHeader } from "@/components/ui/PageHeader";
import { FileText, Search } from "lucide-react";
import { toast } from "sonner";

export default function CertificateVerification() {
  const [verificationTab, setVerificationTab] = useState<string>("manual");
  
  const handleQrCodeDetected = (code: string) => {
    // Here you can implement the logic for what happens when a QR code is detected
    toast.success(`QR Code detected: ${code}`);
    setVerificationTab("manual");
    // You might want to pre-fill the verification form with the detected code
  };
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <PageHeader
          icon={<FileText className="h-7 w-7 text-primary" />}
          title="Certificate Verification"
          subtitle="Use this tool to verify the authenticity of certificates issued by our organization."
        />

        <div className="mt-4">
          <Tabs 
            value={verificationTab} 
            onValueChange={setVerificationTab}
            className="max-w-md mx-auto"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Manual Entry
              </TabsTrigger>
              <TabsTrigger value="scan" className="flex items-center gap-2">
                <QrScanner className="h-4 w-4" />
                Scan QR Code
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="manual">
              <CertificateVerifier />
            </TabsContent>
            
            <TabsContent value="scan">
              <Card>
                <CardHeader>
                  <CardTitle>Scan Certificate QR Code</CardTitle>
                  <CardDescription>
                    Use your device's camera to scan the QR code on the certificate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <QrScanner 
                    onCodeDetected={handleQrCodeDetected} 
                    className="w-full" 
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="max-w-md mx-auto mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">About Certificate Verification</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>
                  All certificates issued by our organization contain a unique verification code and QR code 
                  that can be used to confirm their authenticity.
                </p>
                <p>
                  A valid certificate will display all relevant information including:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Recipient's name</li>
                  <li>Course completed</li>
                  <li>Issue date</li>
                  <li>Expiry date</li>
                </ul>
                <p className="text-muted-foreground italic mt-4">
                  If a certificate does not verify successfully, please contact our support team.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

