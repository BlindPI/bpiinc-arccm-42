
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
import { LocationForm } from './LocationForm';
import { LocationSearch } from './LocationSearch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Location } from '@/types/courses';
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
  const { data: locations, isLoading } = useLocationData(searchFilters);
  const { data: profile } = useProfile();

  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  return (
    <Card className="border border-border/50">
      {showSearch && (
        <div className="p-4 border-b border-border/50">
          <LocationSearch 
            onSearch={setSearchFilters}
            className="max-w-2xl mx-auto"
          />
        </div>
      )}
      
      {isLoading ? (
        <div className="text-center py-8">Loading locations...</div>
      ) : locations?.length === 0 ? (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No locations found</p>
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
              <TableRow key={location.id} className="hover:bg-muted/30">
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
