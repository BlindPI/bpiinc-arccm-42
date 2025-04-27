
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocationData } from '@/hooks/useLocationData';
import { Search, MapPin, X } from 'lucide-react';

interface LocationSearchProps {
  onSearch: (filters: { search?: string; city?: string }) => void;
  className?: string;
}

export function LocationSearch({ onSearch, className }: LocationSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const { cities } = useLocationData();

  const handleSearch = () => {
    onSearch({
      search: searchTerm || undefined,
      city: selectedCity || undefined
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCity('');
    onSearch({});
  };

  return (
    <div className={className}>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
        </div>
        
        <div className="w-full sm:w-40">
          <Select
            value={selectedCity}
            onValueChange={setSelectedCity}
          >
            <SelectTrigger className="w-full">
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Cities</SelectItem>
              {cities?.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleSearch}
            className="w-full sm:w-auto bg-primary hover:bg-primary-600 text-white"
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          
          <Button 
            variant="outline" 
            onClick={clearFilters}
            className="w-full sm:w-auto border-border/50 hover:bg-muted"
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
