// Define the Location type with all required fields
export interface Location {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  status: string;
  created_at: string;
  updated_at: string;
  // Add missing fields that are causing TypeScript errors
  email?: string;
  phone?: string;
  website?: string;
  logo_url?: string;
}

export interface LocationInsert extends Omit<Location, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}
