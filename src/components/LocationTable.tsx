
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, ExternalLink, Search, MapPin } from 'lucide-react';
import { useLocationData } from '@/hooks/useLocationData';
import { useProfile } from '@/hooks/useProfile';
import { LocationForm } from './LocationForm';
import { LocationSearch } from './LocationSearch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Location } from '@/types/courses';
import { Card } from './ui/card';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface LocationTableProps {
  filters?: {
    search?: string;
    city?: string;
    status?: 'ACTIVE' | 'INACTIVE';
  };
  showSearch?: boolean;
}

export function LocationTable({ filters, showSearch }: LocationTableProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [searchFilters, setSearchFilters] = useState(filters || {});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const { locations, isLoading, error } = useLocationData(searchFilters);
  const { data: profile } = useProfile();
  const { handleError } = useErrorHandler();

  const handleSearch = (newFilters: { search?: string; city?: string }) => {
    // Handle the "_all" value from LocationSearch
    if (newFilters.city === "_all") {
      newFilters.city = undefined;
    }
    
    setSearchFilters({
      ...searchFilters,
      ...newFilters
    });
    
    // Reset to first page when search filters change
    setCurrentPage(1);
  };

  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  
  // Handle pagination
  const totalItems = locations?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedLocations = locations?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // If there's an error, handle it
  if (error) {
    handleError(error, "Failed to load locations");
  }

  return (
    <Card className="border border-border/50 shadow-sm">
      {showSearch && (
        <div className="p-4 border-b border-border/50 bg-muted/30">
          <LocationSearch 
            onSearch={handleSearch}
            className="max-w-2xl mx-auto"
          />
        </div>
      )}
      
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p>Loading locations...</p>
        </div>
      ) : locations?.length === 0 ? (
        <div className="text-center py-12 px-4">
          <Search className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-1">No locations found</h3>
          <p className="text-muted-foreground">Try adjusting your search criteria</p>
        </div>
      ) : (
        <>
          {/* Desktop view */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Address</TableHead>
                  <TableHead className="font-semibold">City</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLocations?.map((location) => (
                  <TableRow key={location.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{location.name}</TableCell>
                    <TableCell>{location.address || '-'}</TableCell>
                    <TableCell>{location.city || '-'}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={location.status === 'ACTIVE' ? 'success' : 'secondary'}
                        className="font-medium"
                      >
                        {location.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {isAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedLocation(location)}
                            className="hover:bg-primary/10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {location.address && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const addressForMaps = encodeURIComponent(
                                `${location.address}, ${location.city || ''}, ${location.state || ''}`
                              );
                              window.open(`https://maps.google.com/?q=${addressForMaps}`, '_blank');
                            }}
                            className="hover:bg-primary/10"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Mobile view */}
          <div className="md:hidden">
            <div className="divide-y">
              {paginatedLocations?.map((location) => (
                <div key={location.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{location.name}</div>
                    <Badge 
                      variant={location.status === 'ACTIVE' ? 'success' : 'secondary'}
                      className="font-medium"
                    >
                      {location.status}
                    </Badge>
                  </div>
                  
                  {location.city && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                      <MapPin className="h-3 w-3" />
                      <span>{location.city}{location.state ? `, ${location.state}` : ''}</span>
                    </div>
                  )}
                  
                  {location.address && (
                    <div className="text-sm text-muted-foreground mb-2">
                      {location.address}
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-3">
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedLocation(location)}
                        className="text-xs hover:bg-primary/10"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    )}
                    {location.address && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const addressForMaps = encodeURIComponent(
                            `${location.address}, ${location.city || ''}, ${location.state || ''}`
                          );
                          window.open(`https://maps.google.com/?q=${addressForMaps}`, '_blank');
                        }}
                        className="text-xs hover:bg-primary/10"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Map
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="py-3 px-4 border-t border-gray-100">
              <Pagination className="justify-center md:justify-between">
                <div className="hidden md:flex items-center text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} locations
                </div>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1} 
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                    let pageNumber: number;
                    
                    if (totalPages <= 5) {
                      pageNumber = idx + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = idx + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + idx;
                    } else {
                      pageNumber = currentPage - 2 + idx;
                    }
                    
                    return (
                      <PaginationItem key={pageNumber} className="hidden md:inline-block">
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNumber)}
                          isActive={currentPage === pageNumber}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}

      <Dialog 
        open={!!selectedLocation} 
        onOpenChange={(open) => !open && setSelectedLocation(null)}
      >
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
          </DialogHeader>
          <LocationForm
            location={selectedLocation}
            onComplete={() => setSelectedLocation(null)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
