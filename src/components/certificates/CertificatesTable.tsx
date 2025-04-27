
import React from 'react';
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Award, Download, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useProfile } from '@/hooks/useProfile';

interface CertificatesTableProps {
  certificates: any[];
  isLoading: boolean;
  onDeleteCertificate?: (certificateId: string) => void;
  onBulkDelete?: () => void;
  isDeleting?: boolean;
  isBulkDeleting?: boolean;
}

export function CertificatesTable({ 
  certificates, 
  isLoading, 
  onDeleteCertificate,
  onBulkDelete,
  isDeleting = false,
  isBulkDeleting = false
}: CertificatesTableProps) {
  const isMobile = useIsMobile();
  const { data: profile } = useProfile();
  const [deletingCertificateId, setDeletingCertificateId] = React.useState<string | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = React.useState<boolean>(false);

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

  const handleDeleteCertificate = async () => {
    if (deletingCertificateId && onDeleteCertificate) {
      onDeleteCertificate(deletingCertificateId);
      setDeletingCertificateId(null);
    }
  };

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      onBulkDelete();
      setConfirmBulkDelete(false);
    }
  };

  return (
    <ScrollArea className="h-[600px] w-full">
      <div className="p-4">
        {profile?.role === 'SA' && certificates.length > 0 && (
          <AlertDialog
            open={confirmBulkDelete}
            onOpenChange={setConfirmBulkDelete}
          >
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="mb-4"
                disabled={isBulkDeleting}
              >
                {isBulkDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Delete All Test Data
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete All Certificates</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete all certificates? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleBulkDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

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
              <TableRow key={cert.id} className="group">
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
                <TableCell className={`text-right flex items-center justify-end gap-2 ${isMobile ? 'py-2 px-2' : ''}`}>
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
                  
                  {profile?.role === 'SA' && (
                    <AlertDialog 
                      open={deletingCertificateId === cert.id}
                      onOpenChange={(open) => 
                        open ? setDeletingCertificateId(cert.id) : setDeletingCertificateId(null)
                      }
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex items-center gap-1"
                          disabled={isDeleting && deletingCertificateId === cert.id}
                        >
                          {isDeleting && deletingCertificateId === cert.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          {!isMobile && (isDeleting && deletingCertificateId === cert.id ? 'Deleting...' : 'Delete')}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Certificate</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this certificate? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleDeleteCertificate}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isDeleting}
                          >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
