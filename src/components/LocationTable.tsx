
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
import { Edit, ExternalLink, Search } from 'lucide-react';
import { useLocationData } from '@/hooks/useLocationData';
import { useProfile } from '@/hooks/useProfile';
import { EnhancedLocationForm } from './locations/EnhancedLocationForm';
import { LocationSearch } from './LocationSearch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Location } from '@/types/supabase-schema';
import { Card } from './ui/card';

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
  const { locations, isLoading } = useLocationData(searchFilters);
  const { data: profile } = useProfile();

  const handleSearch = (newFilters: { search?: string; city?: string }) => {
    // Handle the "_all" value from LocationSearch
    if (newFilters.city === "_all") {
      newFilters.city = undefined;
    }
    
    setSearchFilters({
      ...searchFilters,
      ...newFilters
    });
  };

  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

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
            {locations?.map((location) => (
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
                            `${location.address}, ${location.city || ''}`
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
      )}

      <Dialog 
        open={!!selectedLocation} 
        onOpenChange={(open) => !open && setSelectedLocation(null)}
      >
        <DialogContent>
          <EnhancedLocationForm
            location={selectedLocation}
            onComplete={() => setSelectedLocation(null)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
