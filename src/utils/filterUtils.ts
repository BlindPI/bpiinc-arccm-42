
import { FilterSet, SavedItem } from '@/types/filter-types';
import { SortColumn, SortDirection } from '@/types/certificateFilters';

/**
 * Utility functions for filtering and exporting data
 */

export function getDefaultFilters(): FilterSet {
  return {
    search: '',
    role: '',
    compliance: ''
  };
}

export function getSavedFilterKey(name: string): string {
  return `saved_filter_${name}`;
}

export function saveFilter(filter: SavedItem): void {
  try {
    localStorage.setItem(
      getSavedFilterKey(filter.name),
      JSON.stringify(filter)
    );
  } catch (error) {
    console.error('Error saving filter:', error);
  }
}

export function getSavedFilters(): SavedItem[] {
  try {
    const filters: SavedItem[] = [];
    // Iterate through localStorage to find saved filters
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('saved_filter_')) {
        try {
          const savedFilter = JSON.parse(localStorage.getItem(key) || '');
          filters.push(savedFilter);
        } catch (e) {
          console.error('Invalid saved filter in storage:', e);
        }
      }
    }
    return filters;
  } catch (error) {
    console.error('Error retrieving saved filters:', error);
    return [];
  }
}

export function deleteSavedFilter(name: string): void {
  try {
    localStorage.removeItem(getSavedFilterKey(name));
  } catch (error) {
    console.error('Error deleting filter:', error);
  }
}

/**
 * Export data to CSV format
 * @param data Array of objects to export
 * @param filename Name of the exported file
 */
export function exportToCsv<T extends Record<string, any>>(data: T[], filename: string): void {
  if (!data || data.length === 0) {
    console.error('No data to export');
    return;
  }

  try {
    // Get headers from the first object
    const headers = Object.keys(data[0]);
    
    // Convert data to CSV format
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const cell = row[header] === null || row[header] === undefined ? '' : row[header];
        // Handle special characters and commas
        return typeof cell === 'string' ? `"${cell.replace(/"/g, '""')}"` : cell;
      });
      csvRows.push(values.join(','));
    }
    
    // Create CSV content
    const csvContent = csvRows.join('\n');
    
    // Create downloadable blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Set link properties
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    // Append to body, trigger download, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting data to CSV:', error);
    throw new Error('Failed to export data');
  }
}

/**
 * Format sort parameters for API requests
 * @param column Column to sort by
 * @param direction Sort direction ('asc' or 'desc')
 */
export function formatSortParams(column: SortColumn, direction: SortDirection) {
  return {
    orderBy: column,
    ascending: direction === 'asc'
  };
}

/**
 * Debounce function to limit the rate at which a function can fire
 * @param fn Function to debounce
 * @param ms Milliseconds to wait
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, ms = 300) {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
}
