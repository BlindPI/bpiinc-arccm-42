
import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CertificateVerifier } from "@/components/certificates/CertificateVerifier";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QrScanner } from "@/components/certificates/QrScanner";
import { PageHeader } from "@/components/ui/PageHeader";
import { FileText, Search, History } from "lucide-react";
import { toast } from "sonner";
import { VerificationResult } from "@/components/certificates/VerificationResult";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

interface CertificateVerificationProps {
  embedded?: boolean;
}

export default function CertificateVerification({ embedded = false }: CertificateVerificationProps) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [verificationTab, setVerificationTab] = useState<string>("manual");
  const [verificationHistory, setVerificationHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [verificationCode, setVerificationCode] = useState<string>("");
  
  const handleQrCodeDetected = (code: string) => {
    toast.success(`QR Code detected: ${code}`);
    setVerificationTab("manual");
    setVerificationCode(code);
  };

  const fetchVerificationHistory = async () => {
    if (!user) return;
    
    try {
      setIsLoadingHistory(true);
      const { data, error } = await supabase
        .from('certificate_verification_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      
      setVerificationHistory(data || []);
    } catch (error: any) {
      console.error('Error fetching verification history:', error);
      toast.error(`Failed to load verification history: ${error.message}`);
    } finally {
      setIsLoadingHistory(false);
    }
  };
  
  // Load verification history when tab changes to history
  const handleTabChange = (tab: string) => {
    setVerificationTab(tab);
    if (tab === "history" && user) {
      fetchVerificationHistory();
    }
  };
  
  const content = (
    <div className="container mx-auto py-6">
      {!embedded && (
        <PageHeader
          icon={<FileText className="h-7 w-7 text-primary" />}
          title="Certificate Verification"
          subtitle="Use this tool to verify the authenticity of certificates issued by our organization."
        />
      )}

      <div className="mt-4">
        <Tabs 
          value={verificationTab} 
          onValueChange={handleTabChange}
          className="max-w-md mx-auto"
        >
          <TabsList 
            className="grid w-full grid-cols-3"
            gradient="bg-gradient-to-r from-amber-500 to-orange-500"
          >
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Manual Entry
            </TabsTrigger>
            <TabsTrigger value="scan" className="flex items-center gap-2">
              <QrScanner className="h-4 w-4" onCodeDetected={handleQrCodeDetected} />
              Scan QR Code
            </TabsTrigger>
            {user && (
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="manual">
            <CertificateVerifier initialVerificationCode={verificationCode} />
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
          
          {user && (
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Verification History</CardTitle>
                  <CardDescription>
                    Your recent certificate verification attempts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingHistory ? (
                    <div className="py-4 text-center">Loading history...</div>
                  ) : verificationHistory.length > 0 ? (
                    <div className="space-y-4">
                      {verificationHistory.map((log) => (
                        <div key={log.id} className="border rounded-md p-3">
                          <div className="flex justify-between">
                            <span className="font-medium">Code: {log.verification_code}</span>
                            <span className={`text-sm ${log.result === 'FOUND' ? 'text-green-600' : 'text-red-600'}`}>
                              {log.result}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-muted-foreground">
                      No verification history found
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
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
  );

  if (embedded) {
    return content;
  }

  return (
    <DashboardLayout>
      {content}
    </DashboardLayout>
  );
}
