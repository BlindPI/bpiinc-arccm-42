import React from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Certificate } from '@/types/certificates';
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Download, Trash2 } from 'lucide-react';
import { useCertificateOperations } from '@/hooks/useCertificateOperations';
import { ConfirmDeleteDialog } from '@/components/certificates/ConfirmDeleteDialog';
import { SortableTableHeader } from '@/components/certificates/SortableTableHeader';
import { SortColumn, SortDirection, CertificateFilters } from '@/types/certificateFilters';
import { CertificateFilters as CertificateFiltersComponent } from '@/components/certificates/CertificateFilters';

interface EnhancedCertificatesTableProps {
  certificates: Certificate[] | undefined;
  isLoading: boolean;
  sortConfig: {
    column: SortColumn;
    direction: SortDirection;
  };
  onSort: (column: SortColumn) => void;
  filters: CertificateFilters;
  onFiltersChange: (filters: CertificateFilters) => void;
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
  batches
}: EnhancedCertificatesTableProps) {
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

  const selectedCertificateIds = React.useRef<string[]>([]);
  const [selectAll, setSelectAll] = React.useState(false);

  React.useEffect(() => {
    if (certificates) {
      if (selectAll) {
        selectedCertificateIds.current = certificates.map(cert => cert.id);
      } else {
        selectedCertificateIds.current = [];
      }
    }
  }, [selectAll, certificates]);

  const handleCheckboxChange = (certificateId: string) => {
    if (selectedCertificateIds.current.includes(certificateId)) {
      selectedCertificateIds.current = selectedCertificateIds.current.filter(id => id !== certificateId);
      setSelectAll(false);
    } else {
      selectedCertificateIds.current = [...selectedCertificateIds.current, certificateId];
      if (certificates && selectedCertificateIds.current.length === certificates.length) {
        setSelectAll(true);
      }
    }
  };

  const handleDownloadSelected = () => {
    if (certificates) {
      generateCertificatesZip(selectedCertificateIds.current, certificates);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <CertificateFiltersComponent
          filters={filters}
          onFiltersChange={onFiltersChange}
          onResetFilters={onResetFilters}
          batches={batches}
        />
        {isAdmin && (
          <div className="flex items-center space-x-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmBulkDelete(true)}
              disabled={isDeleting || !certificates?.length}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete All
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadSelected}
              disabled={isDownloading || selectedCertificateIds.current.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Selected
            </Button>
          </div>
        )}
      </div>

      <Table>
        <TableCaption>
          {isAdmin ? 'Manage certificates here.' : 'Your certificates.'}
        </TableCaption>
        <TableHeader>
          <TableRow>
            {isAdmin && (
              <TableHead className="w-[50px]">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={() => setSelectAll(!selectAll)}
                  aria-label="Select all"
                />
              </TableHead>
            )}
            <SortableTableHeader
              column="recipient_name"
              label="Recipient"
              currentSortColumn={sortConfig.column}
              sortDirection={sortConfig.direction}
              onSort={onSort}
            />
            <SortableTableHeader
              column="course_name"
              label="Course"
              currentSortColumn={sortConfig.column}
              sortDirection={sortConfig.direction}
              onSort={onSort}
            />
            <SortableTableHeader
              column="issue_date"
              label="Issue Date"
              currentSortColumn={sortConfig.column}
              sortDirection={sortConfig.direction}
              onSort={onSort}
            />
            <SortableTableHeader
              column="expiry_date"
              label="Expiry Date"
              currentSortColumn={sortConfig.column}
              sortDirection={sortConfig.direction}
              onSort={onSort}
            />
            <SortableTableHeader
              column="status"
              label="Status"
              currentSortColumn={sortConfig.column}
              sortDirection={sortConfig.direction}
              onSort={onSort}
            />
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {isAdmin && (
                    <TableCell className="w-[50px]">
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                  )}
                  <TableCell>
                    <Skeleton className="h-4 w-[150px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[150px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[80px]" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-[80px] ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </>
          ) : certificates && certificates.length > 0 ? (
            certificates.map((certificate) => (
              <TableRow key={certificate.id}>
                {isAdmin && (
                  <TableCell className="w-[50px]">
                    <input
                      type="checkbox"
                      checked={selectedCertificateIds.current.includes(certificate.id)}
                      onChange={() => handleCheckboxChange(certificate.id)}
                      aria-label={`Select certificate ${certificate.id}`}
                    />
                  </TableCell>
                )}
                <TableCell>{certificate.recipient_name}</TableCell>
                <TableCell>{certificate.course_name}</TableCell>
                <TableCell>
                  {certificate.issue_date ? format(new Date(certificate.issue_date), 'MMM d, yyyy') : 'N/A'}
                </TableCell>
                <TableCell>
                  {certificate.expiry_date ? format(new Date(certificate.expiry_date), 'MMM d, yyyy') : 'N/A'}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      certificate.status === 'ACTIVE'
                        ? 'success'
                        : certificate.status === 'EXPIRED'
                          ? 'warning'
                          : 'destructive'
                    }
                  >
                    {certificate.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={async () => {
                        if (certificate.certificate_url) {
                          const url = await getDownloadUrl(certificate.certificate_url);
                          if (url) {
                            window.open(url, '_blank');
                          }
                        } else {
                          toast.error('No certificate URL found');
                        }
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setDeletingCertificateId(certificate.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                No certificates found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={7}>
              {certificates ? certificates.length : 0} Certificates
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>

      <ConfirmDeleteDialog
        isOpen={deletingCertificateId !== null}
        onClose={() => setDeletingCertificateId(null)}
        onConfirm={() => {
          if (deletingCertificateId) {
            handleDeleteCertificate(deletingCertificateId);
          }
        }}
        isDeleting={isDeleting}
      />

      <ConfirmDeleteDialog
        isOpen={confirmBulkDelete}
        onClose={() => setConfirmBulkDelete(false)}
        onConfirm={handleBulkDelete}
        isDeleting={isDeleting}
        title="Delete All Certificates"
        description="Are you sure you want to delete all certificates? This action cannot be undone."
      />
    </div>
  );
}
