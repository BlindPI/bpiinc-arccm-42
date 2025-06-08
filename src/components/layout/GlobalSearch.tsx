
import React from 'react';
import { IntelligentSearch } from '@/components/search/IntelligentSearch';
import { SearchResult } from '@/services/search/intelligentSearchService';
import { useNavigate } from 'react-router-dom';

export const GlobalSearch: React.FC = () => {
  const navigate = useNavigate();

  const handleResultSelect = (result: SearchResult) => {
    // Navigate to appropriate page based on entity type
    switch (result.entityType) {
      case 'teams':
        navigate(`/teams/${result.entityId}`);
        break;
      case 'profiles':
        navigate(`/profiles/${result.entityId}`);
        break;
      case 'certificates':
        navigate(`/certificates/${result.entityId}`);
        break;
      case 'locations':
        navigate(`/locations/${result.entityId}`);
        break;
      default:
        // Generic search results page
        navigate(`/search?q=${encodeURIComponent(result.searchContent)}&type=${result.entityType}`);
    }
  };

  return (
    <IntelligentSearch
      onResultSelect={handleResultSelect}
      placeholder="Search teams, members, certificates..."
      className="w-full max-w-md"
    />
  );
};
