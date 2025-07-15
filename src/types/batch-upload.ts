
export interface ProcessedData {
  data: any[];
  totalCount: number;
  errorCount: number;
  courseMismatches: number;
}

export interface ProcessingStatus {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  errors: string[]; // Changed from optional to required to match the type in certificates/types.ts
}

// Add helper function to create default objects
export const createDefaultProcessingStatus = (): ProcessingStatus => ({
  total: 0,
  processed: 0,
  successful: 0,
  failed: 0,
  errors: []
});

export const createDefaultProcessedData = (): ProcessedData => ({
  data: [],
  totalCount: 0,
  errorCount: 0,
  courseMismatches: 0
});

// Add batch information interface for clearer typing
export interface BatchInfo {
  batchId: string;
  batchName: string;
  submittedBy: string;
  submittedAt: string;
}

// Generate a roster ID based on user name, date and time
export const generateRosterId = (userName: string): string => {
  // Get user initials (up to 2 characters)
  const initials = userName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
    .padEnd(2, 'X'); // Ensure we have 2 characters

  // Generate date and time components
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const timePart = now.toISOString().slice(11, 16).replace(':', ''); // HHMM

  // Add a random 2-digit sequence for uniqueness
  const sequence = Math.floor(Math.random() * 100).toString().padStart(2, '0');

  // Format: [INITIALS]-[YYYYMMDD]-[HHMM]-[SEQ]
  return `${initials}-${datePart}-${timePart}-${sequence}`;
};
