
/**
 * Types for filter management in user management pages
 */

export interface FilterSet {
  search: string;
  role: string;
  compliance: string;
}

export interface SavedItem {
  name: string;
  filters: FilterSet;
}
