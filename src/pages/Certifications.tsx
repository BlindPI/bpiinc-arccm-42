
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CertificateForm } from "@/components/CertificateForm";
import { CertificateRequests } from "@/components/CertificateRequests";
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
import { ExternalLink } from "lucide-react";

export default function Certifications() {
  const { data: profile } = useProfile();
  const canManageRequests = profile?.role && ['SA', 'AD'].includes(profile.role);

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

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Certificate Management</h1>
          <p className="text-muted-foreground">
            {canManageRequests 
              ? 'Review and manage certificate requests or create new certificates'
              : 'Request new certificates and view your requests'}
          </p>
        </div>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full max-w-[600px] grid-cols-3">
            <TabsTrigger value="requests">
              {canManageRequests ? 'Pending Approvals' : 'My Requests'}
            </TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
            <TabsTrigger value="new">
              {canManageRequests ? 'New Certificate' : 'New Request'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="requests" className="mt-6">
            <CertificateRequests />
          </TabsContent>
          
          <TabsContent value="certificates" className="mt-6">
            <Card>
              <ScrollArea className="h-[600px] w-full">
                <Table>
                  <TableCaption>List of all certificates</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Certificate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certificates?.map((cert) => (
                      <TableRow key={cert.id}>
                        <TableCell>{cert.recipient_name}</TableCell>
                        <TableCell>{cert.course_name}</TableCell>
                        <TableCell>{format(new Date(cert.issue_date), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{format(new Date(cert.expiry_date), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            cert.status === 'ACTIVE' 
                              ? 'bg-green-100 text-green-800'
                              : cert.status === 'EXPIRED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {cert.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {cert.certificate_url && (
                            <a
                              href={cert.certificate_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-blue-600 hover:text-blue-800"
                            >
                              View <ExternalLink className="ml-1 h-4 w-4" />
                            </a>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </Card>
          </TabsContent>
          
          <TabsContent value="new" className="mt-6">
            <div className="max-w-2xl mx-auto">
              <CertificateForm />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
