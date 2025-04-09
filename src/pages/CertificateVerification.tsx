
import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CertificateVerifier } from "@/components/certificates/CertificateVerifier";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QrScanner } from "@/components/certificates/QrScanner";

export default function CertificateVerification() {
  const [verificationTab, setVerificationTab] = useState<string>("manual");
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Certificate Verification</h1>
        <p className="text-muted-foreground mb-6">
          Use this tool to verify the authenticity of certificates issued by our organization.
        </p>
        
        <div className="mt-6">
          <Tabs 
            value={verificationTab} 
            onValueChange={setVerificationTab}
            className="max-w-md mx-auto"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="scan">Scan QR Code</TabsTrigger>
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
                  <QrScanner onCodeDetected={() => setVerificationTab("manual")} />
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
