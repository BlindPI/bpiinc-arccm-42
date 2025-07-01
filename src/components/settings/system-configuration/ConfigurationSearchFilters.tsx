
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ConfigurationSearchFiltersProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const ConfigurationSearchFilters: React.FC<ConfigurationSearchFiltersProps> = ({
  categories,
  selectedCategory,
  onCategoryChange
}) => {
  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Filter by Category
            </h4>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "secondary"}
                  className="cursor-pointer hover:bg-primary/80"
                  onClick={() => onCategoryChange(
                    selectedCategory === category ? '' : category
                  )}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                  {selectedCategory === category && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>
          
          {selectedCategory && (
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-xs text-gray-500">
                Filtering by: <strong>{selectedCategory}</strong>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCategoryChange('')}
                className="h-6 px-2 text-xs"
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
