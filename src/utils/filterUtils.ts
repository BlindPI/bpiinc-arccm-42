
/**
 * Safely checks if a value should be included in a filter
 * Handles 'all', null, undefined, and "null"/"undefined" string values
 * 
 * @param value The filter value to check
 * @returns boolean indicating if the value should be filtered
 */
export function shouldApplyFilter(value: string | null | undefined): boolean {
  if (value === undefined || value === null) return false;
  if (value === 'all') return false;
  if (value === 'undefined' || value === 'null') return false;
  return true;
}

/**
 * Safely formats a date object as a string for database queries
 * 
 * @param date The date to format, or undefined
 * @returns A formatted date string or undefined
 */
export function formatDateForQuery(date: Date | undefined): string | undefined {
  if (!date) return undefined;
  return date.toISOString().split('T')[0];
}

/**
 * Creates a serialized string of filter parameters to detect changes
 * 
 * @param params Object containing filter parameters
 * @returns A string representation of the parameters
 */
export function serializeFilterParams(params: Record<string, any>): string {
  return JSON.stringify(params);
}
