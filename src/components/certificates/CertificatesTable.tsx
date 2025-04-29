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
import { AlertDialog, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { DeleteCertificateDialog } from './DeleteCertificateDialog';
import { useCertificateOperations } from '@/hooks/useCertificateOperations';
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
  isLoading
}: CertificatesTableProps) {
  const isMobile = useIsMobile();
  const { data: profile } = useProfile();
  const {
    deletingCertificateId,
    setDeletingCertificateId,
    confirmBulkDelete,
    setConfirmBulkDelete,
    handleDeleteCertificate,
    handleBulkDelete,
    getDownloadUrl,
    isDeleting,
    isAdmin
  } = useCertificateOperations();

  return (
    <ScrollArea className="h-[600px] w-full">
      {isAdmin && certificates.length > 0 && (
        <div className="p-4">
          <AlertDialog
            open={confirmBulkDelete}
            onOpenChange={setConfirmBulkDelete}
          >
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="mb-4"
                disabled={isDeleting}
              >
                {isDeleting ? (
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
            <DeleteCertificateDialog
              isOpen={confirmBulkDelete}
              onOpenChange={setConfirmBulkDelete}
              onConfirmDelete={handleBulkDelete}
              isDeleting={isDeleting}
              isBulkDelete
            />
          </AlertDialog>
        </div>
      )}

      <Table>
        <TableCaption>
          {isAdmin 
            ? "List of all certificates" 
            : "List of your certificates"}
        </TableCaption>
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
                {!isAdmin && (
                  <p className="text-muted-foreground mt-2">
                    Certificates will appear here after your requests are approved
                  </p>
                )}
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
                  {format(new Date(cert.issue_date), 'MMMM d, yyyy')}
                </TableCell>
                <TableCell className={isMobile ? 'text-sm py-2 px-2' : ''}>
                  {format(new Date(cert.expiry_date), 'MMMM d, yyyy')}
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
                  
                  {isAdmin && (
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
                      <DeleteCertificateDialog
                        isOpen={deletingCertificateId === cert.id}
                        onOpenChange={(open) => 
                          !open && setDeletingCertificateId(null)
                        }
                        onConfirmDelete={() => handleDeleteCertificate(cert.id)}
                        isDeleting={isDeleting}
                      />
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