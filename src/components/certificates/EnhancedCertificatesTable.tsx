
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Certificate } from '@/types/certificates';
import { CertificateFilters, SortColumn, SortConfig, SortDirection } from '@/types/certificateFilters';
import { CertificateFilters as CertificateFiltersComponent } from './CertificateFilters';
import { BadgePlus, DownloadCloud, Loader2, RefreshCw, Search } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { toast } from 'sonner';
import { usePagination } from '@/hooks/usePagination';
import { DataPagination } from '@/components/ui/data-pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { handleError } from '@/utils/error-handler';

interface EnhancedCertificatesTableProps {
  certificates: Certificate[];
  isLoading: boolean;
  sortConfig: SortConfig;
  onSort: (column: SortColumn) => void;
  filters: CertificateFilters;
  onFiltersChange: (filters: CertificateFilters) => void;
  onResetFilters: () => void;
  batches: { id: string; name: string }[];
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
  const [searchTerm, setSearchTerm] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter certificates by search term
  const filteredCertificates = React.useMemo(() => {
    try {
      if (!searchTerm) return certificates;

      const term = searchTerm.toLowerCase();
      return certificates.filter(cert =>
        (cert.recipient_name && cert.recipient_name.toLowerCase().includes(term)) ||
        (cert.course_name && cert.course_name.toLowerCase().includes(term)) ||
        (cert.verification_code && cert.verification_code.toLowerCase().includes(term))
      );
    } catch (error) {
      handleError(error, { 
        context: 'Certificate filtering',
        showToast: false
      });
      return certificates;
    }
  }, [certificates, searchTerm]);

  // Setup pagination
  const {
    paginatedData,
    currentPage,
    totalPages,
    goToPage,
    totalItems,
    startItem,
    endItem
  } = usePagination<Certificate>({
    data: filteredCertificates,
    pageSize: 10
  });

  // Reset pagination when filters change
  useEffect(() => {
    goToPage(1);
  }, [filters]);

  // Handle export of certificates
  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // This would be replaced by actual export logic
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate export
      
      toast.success('Certificates exported successfully');
    } catch (error) {
      handleError(error, { context: 'Certificate export' });
    } finally {
      setIsExporting(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      
      // This would be replaced by actual refresh logic
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate refresh
      
      toast.success('Certificates refreshed');
    } catch (error) {
      handleError(error, { context: 'Certificate refresh' });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Render sort indicator
  const getSortIndicator = (column: SortColumn) => {
    if (sortConfig.column !== column) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search certificates..."
            className="pl-8"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
          >
            {isRefreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting || isLoading}
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <DownloadCloud className="mr-2 h-4 w-4" />
            )}
            Export
          </Button>
        </div>
      </div>
      
      <CertificateFiltersComponent
        filters={filters}
        onFiltersChange={onFiltersChange}
        onResetFilters={onResetFilters}
        batches={batches}
      />
      
      {/* Active filters indicator */}
      {(filters.status !== 'all' || filters.courseId !== 'all' || filters.batchId) && (
        <div className="flex flex-wrap gap-2 py-2">
          <span className="text-sm font-medium text-muted-foreground flex items-center">
            <BadgePlus className="h-3 w-3 mr-1" />
            Active filters:
          </span>
          {filters.status !== 'all' && (
            <div className="bg-muted text-xs rounded px-2 py-1">
              Status: {filters.status}
            </div>
          )}
          {filters.courseId !== 'all' && (
            <div className="bg-muted text-xs rounded px-2 py-1">
              Course filtered
            </div>
          )}
          {filters.batchId && (
            <div className="bg-muted text-xs rounded px-2 py-1">
              Batch: {batches.find(b => b.id === filters.batchId)?.name || filters.batchId}
            </div>
          )}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredCertificates.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No certificates found. Try adjusting your filters.
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => onSort('recipient_name')}
                  >
                    Recipient Name{getSortIndicator('recipient_name')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => onSort('course_name')}
                  >
                    Course{getSortIndicator('course_name')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => onSort('issue_date')}
                  >
                    Issue Date{getSortIndicator('issue_date')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => onSort('expiry_date')}
                  >
                    Expiry Date{getSortIndicator('expiry_date')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => onSort('status')}
                  >
                    Status{getSortIndicator('status')}
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((certificate) => (
                  <TableRow key={certificate.id}>
                    <TableCell>{certificate.recipient_name}</TableCell>
                    <TableCell>{certificate.course_name}</TableCell>
                    <TableCell>{certificate.issue_date}</TableCell>
                    <TableCell>{certificate.expiry_date}</TableCell>
                    <TableCell>
                      <StatusBadge status={certificate.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          Email
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between items-center pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {startItem} to {endItem} of {totalItems} certificates
              </p>
              <DataPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
