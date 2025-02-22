
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CertificateForm } from "@/components/CertificateForm";
import { CertificateRequests } from "@/components/CertificateRequests";
import { BatchCertificateUpload } from "@/components/certificates/BatchCertificateUpload";
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
import { Card } from "@/components/ui/card";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Certifications() {
  const { data: profile } = useProfile();
  const canManageRequests = profile?.role && ['SA', 'AD'].includes(profile.role);
  const isMobile = useIsMobile();

  const { data: certificates } = useQuery({
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
    const { data } = await supabase.storage
      .from('certification-pdfs')
      .createSignedUrl(fileName, 60);

    return data?.signedUrl;
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className={`font-bold tracking-tight ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
            Certificate Management
          </h1>
          <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
            {canManageRequests 
              ? 'Review and manage certificate requests or create new certificates'
              : 'Request new certificates and view your requests'}
          </p>
        </div>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className={`grid w-full max-w-[800px] grid-cols-4 ${isMobile ? 'gap-1 p-1' : ''}`}>
            <TabsTrigger value="requests" className={isMobile ? 'text-sm px-2' : ''}>
              {canManageRequests ? 'Pending Approvals' : 'My Requests'}
            </TabsTrigger>
            <TabsTrigger value="certificates" className={isMobile ? 'text-sm px-2' : ''}>
              Certificates
            </TabsTrigger>
            <TabsTrigger value="new" className={isMobile ? 'text-sm px-2' : ''}>
              {canManageRequests ? 'New Certificate' : 'New Request'}
            </TabsTrigger>
            <TabsTrigger value="batch" className={isMobile ? 'text-sm px-2' : ''}>
              Batch Upload
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="requests" className={isMobile ? 'mt-4' : 'mt-6'}>
            <CertificateRequests />
          </TabsContent>
          
          <TabsContent value="certificates" className={isMobile ? 'mt-4' : 'mt-6'}>
            <Card>
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
                    {certificates?.map((cert) => (
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
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
