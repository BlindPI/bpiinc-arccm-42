
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Award, Download, Trash2, AlertTriangle, Loader2, Mail, Check, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { DeleteCertificateDialog } from './DeleteCertificateDialog';
import { useCertificateOperations } from '@/hooks/useCertificateOperations';
import { useProfile } from '@/hooks/useProfile';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmailCertificateForm } from './EmailCertificateForm';
import { SortableTableHeader } from './SortableTableHeader';
import { CertificateFilters } from './CertificateFilters';
import { SortColumn, SortDirection } from '@/hooks/useCertificateFiltering';

interface EnhancedCertificatesTableProps {
  certificates: any[];
  isLoading: boolean;
  sortConfig: {
    column: SortColumn;
    direction: SortDirection;
  };
  onSort: (column: SortColumn) => void;
  filters: any;
  onFiltersChange: (filters: any) => void;
  onResetFilters: () => void;
  batches?: { id: string; name: string }[];
}

export function EnhancedCertificatesTable({
  certificates,
  isLoading,
  sortConfig,
  onSort,
  filters,
  onFiltersChange,
  onResetFilters,
  batches = []
}: EnhancedCertificatesTableProps) {
  const isMobile = useIsMobile();
  const { data: profile } = useProfile();
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedCertificateForEmail, setSelectedCertificateForEmail] = useState<any | null>(null);
  
  const {
    deletingCertificateId,
    setDeletingCertificateId,
    confirmBulkDelete,
    setConfirmBulkDelete,
    handleDeleteCertificate,
    handleBulkDelete,
    getDownloadUrl,
    generateCertificatesZip,
    isDeleting,
    isDownloading,
    isAdmin
  } = useCertificateOperations();

  // Toggle selection for a single certificate
  const toggleCertificateSelection = (certId: string) => {
    if (selectedCertificates.includes(certId)) {
      setSelectedCertificates(selectedCertificates.filter(id => id !== certId));
    } else {
      setSelectedCertificates([...selectedCertificates, certId]);
    }
  };

  // Toggle select all certificates
  const toggleSelectAll = () => {
    if (selectAll || selectedCertificates.length === certificates.length) {
      setSelectedCertificates([]);
      setSelectAll(false);
    } else {
      setSelectedCertificates(certificates.map(cert => cert.id));
      setSelectAll(true);
    }
  };

  // Handle bulk download of certificates using JSZip
  const handleBulkDownload = async () => {
    if (selectedCertificates.length === 0) {
      toast.error("No certificates selected");
      return;
    }

    try {
      await generateCertificatesZip(selectedCertificates, certificates);
    } catch (error) {
      console.error('Error downloading certificates:', error);
      toast.error('Failed to download certificates');
    }
  };

  // Handle sending email for a certificate
  const handleEmailCertificate = (cert: any) => {
    setSelectedCertificateForEmail(cert);
    setEmailDialogOpen(true);
  };

  // Handle bulk email sending
  const handleBulkEmail = () => {
    if (selectedCertificates.length === 0) {
      toast.error("No certificates selected");
      return;
    }
    if (selectedCertificates.length === 1) {
      const cert = certificates.find(c => c.id === selectedCertificates[0]);
      handleEmailCertificate(cert);
      return;
    }
    
    // For multiple certificates, show a dialog to confirm sending multiple emails
    toast.info(`Bulk email for multiple certificates is not yet implemented.`);
  };

  return (
    <div>
      <CertificateFilters 
        filters={filters}
        onFiltersChange={onFiltersChange}
        onResetFilters={onResetFilters}
        batches={batches}
      />
      
      <ScrollArea className="h-[600px] w-full">
        {/* Bulk Actions Bar */}
        {(isAdmin || selectedCertificates.length > 0) && (
          <div className="p-4 flex justify-between items-center">
            {isAdmin && certificates.length > 0 && (
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
            )}
            
            {selectedCertificates.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {selectedCertificates.length} selected
                </Badge>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex items-center gap-1"
                      disabled={isDownloading}
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Bulk Actions
                          <ChevronDown className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={handleBulkDownload} 
                      className="flex items-center gap-2"
                      disabled={isDownloading}
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Selected ({selectedCertificates.length})</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleBulkEmail} 
                      className="flex items-center gap-2"
                      disabled={isDownloading}
                    >
                      <Mail className="h-4 w-4" />
                      <span>Email Selected</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setSelectedCertificates([])} 
                      className="flex items-center gap-2"
                      disabled={isDownloading}
                    >
                      <Check className="h-4 w-4" />
                      <span>Clear Selection</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
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
              {(isAdmin || certificates.length > 0) && (
                <TableCell className="w-[50px]">
                  <Checkbox 
                    checked={certificates.length > 0 && selectedCertificates.length === certificates.length} 
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all certificates"
                    disabled={isDownloading}
                  />
                </TableCell>
              )}
              <SortableTableHeader
                column="recipient_name"
                label="Recipient"
                currentSortColumn={sortConfig.column}
                sortDirection={sortConfig.direction}
                onSort={onSort}
                className={isMobile ? 'text-xs' : ''}
              />
              <SortableTableHeader
                column="course_name"
                label="Course"
                currentSortColumn={sortConfig.column}
                sortDirection={sortConfig.direction}
                onSort={onSort}
                className={isMobile ? 'text-xs' : ''}
              />
              <SortableTableHeader
                column="issue_date"
                label="Issue Date"
                currentSortColumn={sortConfig.column}
                sortDirection={sortConfig.direction}
                onSort={onSort}
                className={isMobile ? 'text-xs' : ''}
              />
              <SortableTableHeader
                column="expiry_date"
                label="Expiry Date"
                currentSortColumn={sortConfig.column}
                sortDirection={sortConfig.direction}
                onSort={onSort}
                className={isMobile ? 'text-xs' : ''}
              />
              <SortableTableHeader
                column="status"
                label="Status"
                currentSortColumn={sortConfig.column}
                sortDirection={sortConfig.direction}
                onSort={onSort}
                className={isMobile ? 'text-xs' : ''}
              />
              <TableCell className={`text-right ${isMobile ? 'text-xs' : ''}`}>Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex justify-center">
                    <Award className="h-8 w-8 animate-pulse text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mt-2">Loading certificates...</p>
                </TableCell>
              </TableRow>
            ) : certificates?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
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
                  {(isAdmin || certificates.length > 0) && (
                    <TableCell>
                      <Checkbox 
                        checked={selectedCertificates.includes(cert.id)} 
                        onCheckedChange={() => toggleCertificateSelection(cert.id)}
                        aria-label={`Select certificate for ${cert.recipient_name}`}
                        disabled={isDownloading}
                      />
                    </TableCell>
                  )}
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
                      <>
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
                          disabled={isDownloading}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          {isMobile ? '' : 'Download'}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEmailCertificate(cert)}
                          className={`hover:bg-transparent ${isMobile ? 'p-1' : ''}`}
                          disabled={isDownloading}
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          {isMobile ? '' : 'Email'}
                        </Button>
                      </>
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
                            disabled={isDeleting && deletingCertificateId === cert.id || isDownloading}
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

        {/* Email Certificate Dialog */}
        <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Email Certificate</DialogTitle>
            </DialogHeader>
            {selectedCertificateForEmail && (
              <EmailCertificateForm 
                certificate={selectedCertificateForEmail} 
                onClose={() => setEmailDialogOpen(false)} 
              />
            )}
          </DialogContent>
        </Dialog>
      </ScrollArea>
    </div>
  );
}
