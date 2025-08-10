// Application Constants
export const APP_NAME = 'CAFM Dashboard';
export const APP_VERSION = '1.0.0';

// File Upload Constants
export const SUPPORTED_FILE_TYPES = ['.xlsx', '.xls'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Status Constants
export const STATUS_TYPES = {
  COMPLETED: 'Completed',
  DUE: 'Due',
  REPORTED: 'Reported',
  STARTED: 'Started',
  TOTAL: 'Total',
} as const;

// Priority Code Constants
export const PRIORITY_CODES = {
  P11: 'P11',
  P12: 'P12',
  P13: 'P13',
  P14: 'P14',
  P15: 'P15',
  P16: 'P16',
} as const;

// Export Constants
export const EXPORT_FORMATS = {
  XLSX: 'xlsx',
  PDF: 'pdf',
  CSV: 'csv',
} as const;

// UI Constants
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1200,
} as const;

// API Constants (for future use)
export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  UPLOAD: '/api/upload',
  EXPORT: '/api/export',
} as const;
