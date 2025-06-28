
import React, { useState } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { SmartInput } from '../atoms/SmartInput';
import { EnhancedButton } from '../atoms/EnhancedButton';

interface SearchComponentProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onFilterClick?: () => void;
  showFilterButton?: boolean;
  defaultValue?: string;
}

export function SearchComponent({
  placeholder = 'Search...',
  onSearch,
  onFilterClick,
  showFilterButton = true,
  defaultValue = '',
}: SearchComponentProps) {
  const [query, setQuery] = useState(defaultValue);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch?.(value);
  };

  const handleClear = () => {
    setQuery('');
    onSearch?.('');
  };

  return (
    <div className="flex gap-2 items-center">
      <div className="flex-1 relative">
        <SmartInput
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          leftIcon={<Search />}
          rightIcon={
            query && (
              <button
                onClick={handleClear}
                className="hover:bg-gray-100 rounded p-1 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )
          }
        />
      </div>
      
      {showFilterButton && (
        <EnhancedButton
          variant="secondary"
          size="base"
          icon={Filter}
          onClick={onFilterClick}
        >
          Filters
        </EnhancedButton>
      )}
    </div>
  );
}
