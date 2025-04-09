import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CertificateForm } from "@/components/CertificateForm";
import { CertificateRequests } from "@/components/CertificateRequests";
import { BatchCertificateUpload } from "@/components/certificates/BatchCertificateUpload";
import { TemplateManager } from "@/components/certificates/TemplateManager";
import { useProfile } from "@/hooks/useProfile";
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Download, FileCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "react-toastify";

export default function Certifications() {
  const { data: profile } = useProfile();
  const canManageRequests = profile?.role && ['SA', 'AD'].includes(profile.role);
  const isMobile = useIsMobile();

  const { data: certificates, isLoading } = useQuery({
    queryKey: ['certificates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const getDownloadUrl = async (fileName: string) => {
    try {
      if (fileName && (fileName.startsWith('http://') || fileName.startsWith('https://'))) {
        return fileName;
      }
      
      const { data } = await supabase.storage
        .from('certification-pdfs')
        .createSignedUrl(fileName, 60);

      return data?.signedUrl;
    } catch (error) {
      console.error('Error getting download URL:', error);
      toast.error('Failed to get download URL');
      return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className={`font-bold tracking-tight flex items-center gap-2 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
            <Award className="h-6 w-6 text-primary" />
            Certificate Management
          </h1>
          <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
            {canManageRequests 
              ? 'Review and manage certificate requests or create new certificates'
              : 'Request new certificates and view your requests'}
          </p>
        </div>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className={`grid w-full max-w-[900px] grid-cols-5 ${isMobile ? 'gap-1 p-1' : ''}`}>
            <TabsTrigger value="requests" className={`${isMobile ? 'text-sm px-2' : ''} flex items-center gap-1`}>
              <FileCheck className="h-4 w-4" />
              {canManageRequests ? 'Pending Approvals' : 'My Requests'}
            </TabsTrigger>
            <TabsTrigger value="certificates" className={`${isMobile ? 'text-sm px-2' : ''} flex items-center gap-1`}>
              <Award className="h-4 w-4" />
              Certificates
            </TabsTrigger>
            <TabsTrigger value="new" className={`${isMobile ? 'text-sm px-2' : ''} flex items-center gap-1`}>
              <FileCheck className="h-4 w-4" />
              {canManageRequests ? 'New Certificate' : 'New Request'}
            </TabsTrigger>
            <TabsTrigger value="batch" className={`${isMobile ? 'text-sm px-2' : ''} flex items-center gap-1`}>
              <Upload className="h-4 w-4" />
              Batch Upload
            </TabsTrigger>
            {canManageRequests && (
              <TabsTrigger value="templates" className={`${isMobile ? 'text-sm px-2' : ''} flex items-center gap-1`}>
                <FileCheck className="h-4 w-4" />
                Templates
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="requests" className={isMobile ? 'mt-4' : 'mt-6'}>
            <CertificateRequests />
          </TabsContent>
          
          <TabsContent value="certificates" className={isMobile ? 'mt-4' : 'mt-6'}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Certificate History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] w-full">
                  <Table>
                    <TableCaption>List of all certificates</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead className={isMobile ? 'text-xs' : ''}>Recipient</TableHead>
                        <TableHead className={isMobile ? 'text-xs' : ''}>Course</TableHead>
                        <TableHead className={isMobile ? 'text-xs' : ''}>Issue Date</TableHead>
                        <TableHead className={isMobile ? 'text-xs' : ''}>Expiry Date</TableHead>
                        <TableHead className={isMobile ? 'text-xs' : ''}>Status</TableHead>
                        <TableHead className={`text-right ${isMobile ? 'text-xs' : ''}`}>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <div className="flex justify-center">
                              <Award className="h-8 w-8 animate-pulse text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground mt-2">Loading certificates...</p>
                          </TableCell>
                        </TableRow>
                      ) : certificates?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <p className="text-muted-foreground">No certificates found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        certificates?.map((cert) => (
                          <TableRow key={cert.id}>
                            <TableCell className={isMobile ? 'text-sm py-2 px-2' : ''}>
                              {cert.recipient_name}
                            </TableCell>
                            <TableCell className={isMobile ? 'text-sm py-2 px-2' : ''}>
                              {cert.course_name}
                            </TableCell>
                            <TableCell className={isMobile ? 'text-sm py-2 px-2' : ''}>
                              {format(new Date(cert.issue_date), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell className={isMobile ? 'text-sm py-2 px-2' : ''}>
                              {format(new Date(cert.expiry_date), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell className={isMobile ? 'text-sm py-2 px-2' : ''}>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                cert.status === 'ACTIVE' 
                                  ? 'bg-green-100 text-green-800'
                                  : cert.status === 'EXPIRED'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                              }`}>
                                {cert.status}
                              </span>
                            </TableCell>
                            <TableCell className={`text-right ${isMobile ? 'py-2 px-2' : ''}`}>
                              {cert.certificate_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    const url = await getDownloadUrl(cert.certificate_url);
                                    if (url) {
                                      window.open(url, '_blank');
                                    }
                                  }}
                                  className={`hover:bg-transparent ${isMobile ? 'p-1' : ''}`}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  {isMobile ? '' : 'Download'}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="new" className={isMobile ? 'mt-4' : 'mt-6'}>
            <div className="max-w-2xl mx-auto">
              <CertificateForm />
            </div>
          </TabsContent>

          <TabsContent value="batch" className={isMobile ? 'mt-4' : 'mt-6'}>
            <div className="max-w-2xl mx-auto">
              <BatchCertificateUpload />
            </div>
          </TabsContent>
          
          {canManageRequests && (
            <TabsContent value="templates" className={isMobile ? 'mt-4' : 'mt-6'}>
              <div className="max-w-3xl mx-auto">
                <TemplateManager />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
