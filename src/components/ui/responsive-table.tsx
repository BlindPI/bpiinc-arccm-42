
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: any, item: T) => React.ReactNode;
  mobile?: boolean; // Show on mobile
  priority?: 'high' | 'medium' | 'low'; // Display priority
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  itemKey: keyof T;
  title?: string;
  emptyMessage?: string;
  loading?: boolean;
}

export function ResponsiveTable<T>({
  data,
  columns,
  onRowClick,
  itemKey,
  title,
  emptyMessage = "No data available",
  loading = false
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Filter columns based on mobile/desktop and priority
  const visibleColumns = columns.filter(col => {
    if (isMobile) {
      return col.mobile !== false && col.priority === 'high';
    }
    return true;
  });

  const hiddenColumns = columns.filter(col => {
    if (isMobile) {
      return col.mobile === false || col.priority !== 'high';
    }
    return false;
  });

  if (loading) {
    return (
      <Card>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {emptyMessage}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isMobile) {
    return (
      <Card>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent className="space-y-2">
          {data.map((item) => {
            const id = String(item[itemKey]);
            const isExpanded = expandedRows.has(id);
            
            return (
              <Card key={id} className="overflow-hidden">
                <Collapsible open={isExpanded} onOpenChange={() => toggleRow(id)}>
                  <CollapsibleTrigger asChild>
                    <div 
                      className={cn(
                        "w-full p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors",
                        onRowClick && "active:bg-muted"
                      )}
                      onClick={() => onRowClick?.(item)}
                    >
                      <div className="flex-1 space-y-1">
                        {visibleColumns.map((column) => (
                          <div key={String(column.key)} className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground min-w-[80px]">
                              {column.header}:
                            </span>
                            <span className="text-sm">
                              {column.render 
                                ? column.render(item[column.key], item)
                                : String(item[column.key] || '-')
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                      {hiddenColumns.length > 0 && (
                        <Button variant="ghost" size="sm" className="ml-2">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </CollapsibleTrigger>
                  
                  {hiddenColumns.length > 0 && (
                    <CollapsibleContent>
                      <div className="px-4 pb-4 border-t bg-muted/30 space-y-2">
                        {hiddenColumns.map((column) => (
                          <div key={String(column.key)} className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground min-w-[100px]">
                              {column.header}:
                            </span>
                            <span className="text-sm">
                              {column.render 
                                ? column.render(item[column.key], item)
                                : String(item[column.key] || '-')
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  )}
                </Collapsible>
              </Card>
            );
          })}
        </CardContent>
      </Card>
    );
  }

  // Desktop table view
  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                {columns.map((column) => (
                  <th 
                    key={String(column.key)} 
                    className="text-left p-4 font-medium text-muted-foreground"
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr 
                  key={String(item[itemKey])}
                  className={cn(
                    "border-b hover:bg-muted/50 transition-colors",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <td key={String(column.key)} className="p-4">
                      {column.render 
                        ? column.render(item[column.key], item)
                        : String(item[column.key] || '-')
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
