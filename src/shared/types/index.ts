export interface ExcelRow {
  [key: string]: any;
}

export interface OperativeSummary {
  total: number;
  completed: number;
  pending: number;
}

export interface StatusGroups {
  Completed: ExcelRow[];
  Due: ExcelRow[];
  Reported: ExcelRow[];
  Started: ExcelRow[];
  Total: ExcelRow[];
}

export interface PriorityCodeInfo {
  isPriorityCodeP11OrP15: boolean;
  isOtherPriorityCode: boolean;
  priorityCodeValue: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface User {
  username: string;
  isAuthenticated: boolean;
  loginTime?: string;
  lastActive?: string;
}
