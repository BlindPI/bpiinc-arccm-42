
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
import { PlusCircle, MapPin, Edit, ExternalLink } from 'lucide-react';
import { useLocationData } from '@/hooks/useLocationData';
import { useProfile } from '@/hooks/useProfile';
import { LocationForm } from './LocationForm';
import { LocationSearch } from './LocationSearch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Location } from '@/types/courses';

export function LocationTable() {
  const [filters, setFilters] = useState<{ search?: string; city?: string }>({});
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const { data: locations, isLoading } = useLocationData(filters);
  const { data: profile } = useProfile();

  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  const handleEditLocation = (location: Location) => {
    setSelectedLocation(location);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Locations</h2>
        
        {isAdmin && (
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Location
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Add New Location</DialogTitle>
              </DialogHeader>
              <LocationForm onComplete={() => setSelectedLocation(null)} />
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <LocationSearch onSearch={setFilters} className="mb-4" />
      
      {isLoading ? (
        <div className="text-center py-8">Loading locations...</div>
      ) : locations.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MapPin className="mx-auto h-12 w-12 mb-2 opacity-50" />
          <p>No locations found. Try different search criteria or add a new location.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell className="font-medium">{location.name}</TableCell>
                  <TableCell>{location.address || '-'}</TableCell>
                  <TableCell>{location.city || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={location.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {location.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {isAdmin && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditLocation(location)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
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
      )}
      
      {selectedLocation && (
        <Dialog open={!!selectedLocation} onOpenChange={(open) => !open && setSelectedLocation(null)}>
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
      )}
    </div>
  );
}
