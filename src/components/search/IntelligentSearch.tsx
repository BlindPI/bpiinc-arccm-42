
import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Clock, TrendingUp, FileText, Users, MapPin, X } from 'lucide-react';
import { IntelligentSearchService, SearchResult } from '@/services/search/intelligentSearchService';
import { PerformanceMonitor } from '@/services/performance/performanceMonitor';

interface IntelligentSearchProps {
  onResultSelect?: (result: SearchResult) => void;
  placeholder?: string;
  entityTypes?: string[];
  className?: string;
}

export const IntelligentSearch: React.FC<IntelligentSearchProps> = ({
  onResultSelect,
  placeholder = "Search across all data...",
  entityTypes,
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent-searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Search results
  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['intelligent-search', query, entityTypes],
    queryFn: () => IntelligentSearchService.search(query, { entityTypes }),
    enabled: query.length >= 2,
    staleTime: 300000 // 5 minutes
  });

  // Search suggestions
  const { data: suggestions = [] } = useQuery({
    queryKey: ['search-suggestions', query],
    queryFn: () => IntelligentSearchService.getSuggestions(query),
    enabled: query.length >= 2 && searchResults.length === 0
  });

  // Popular searches
  const { data: popularSearches = [] } = useQuery({
    queryKey: ['popular-searches'],
    queryFn: () => IntelligentSearchService.getPopularSearches(5),
    staleTime: 3600000 // 1 hour
  });

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setQuery(searchQuery);
    
    // Track user action
    PerformanceMonitor.trackUserAction('search_performed', {
      query: searchQuery,
      entityTypes
    });
    
    // Add to recent searches
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent-searches', JSON.stringify(updated));
  };

  const handleResultClick = (result: SearchResult) => {
    PerformanceMonitor.trackUserAction('search_result_clicked', {
      entityType: result.entityType,
      entityId: result.entityId,
      rank: result.rank
    });
    
    onResultSelect?.(result);
    setIsOpen(false);
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'teams': return <Users className="h-4 w-4" />;
      case 'profiles': return <Users className="h-4 w-4" />;
      case 'locations': return <MapPin className="h-4 w-4" />;
      case 'certificates': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getEntityColor = (entityType: string) => {
    switch (entityType) {
      case 'teams': return 'bg-blue-100 text-blue-800';
      case 'profiles': return 'bg-green-100 text-green-800';
      case 'locations': return 'bg-purple-100 text-purple-800';
      case 'certificates': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent-searches');
  };

  return (
    <div className={`relative ${className}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.trim()) {
                  handleSearch(query);
                }
              }}
              placeholder={placeholder}
              className="pl-10 pr-4"
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setQuery('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </PopoverTrigger>
        
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command className="rounded-lg border shadow-md">
            <CommandInput 
              value={query}
              onValueChange={setQuery}
              placeholder="Type to search..."
            />
            <CommandList className="max-h-[400px] overflow-y-auto">
              {query.length >= 2 && (
                <>
                  {isLoading && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Searching...
                    </div>
                  )}
                  
                  {!isLoading && searchResults.length > 0 && (
                    <CommandGroup heading="Search Results">
                      {searchResults.slice(0, 8).map((result, index) => (
                        <CommandItem
                          key={`${result.entityType}-${result.entityId}-${index}`}
                          onSelect={() => handleResultClick(result)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-3 w-full">
                            {getEntityIcon(result.entityType)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {result.searchContent}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs ${getEntityColor(result.entityType)}`}
                                >
                                  {result.entityType}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Score: {result.rank.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  
                  {!isLoading && searchResults.length === 0 && suggestions.length > 0 && (
                    <CommandGroup heading="Suggestions">
                      {suggestions.map((suggestion, index) => (
                        <CommandItem
                          key={`suggestion-${index}`}
                          onSelect={() => handleSearch(suggestion)}
                          className="cursor-pointer"
                        >
                          <Search className="h-4 w-4 mr-2" />
                          {suggestion}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  
                  {!isLoading && searchResults.length === 0 && suggestions.length === 0 && (
                    <CommandEmpty>No results found.</CommandEmpty>
                  )}
                </>
              )}
              
              {query.length < 2 && (
                <>
                  {recentSearches.length > 0 && (
                    <CommandGroup 
                      heading={
                        <div className="flex items-center justify-between">
                          <span>Recent Searches</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={clearRecentSearches}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      }
                    >
                      {recentSearches.map((search, index) => (
                        <CommandItem
                          key={`recent-${index}`}
                          onSelect={() => handleSearch(search)}
                          className="cursor-pointer"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          {search}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  
                  {popularSearches.length > 0 && (
                    <CommandGroup heading="Popular Searches">
                      {popularSearches.map((popular, index) => (
                        <CommandItem
                          key={`popular-${index}`}
                          onSelect={() => handleSearch(popular.query)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center">
                              <TrendingUp className="h-4 w-4 mr-2" />
                              {popular.query}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {popular.count}
                            </Badge>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
