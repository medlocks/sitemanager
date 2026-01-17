export type UserRole = 'Admin' | 'SiteManager' | 'Contractor' | 'Employee';

export type ServiceType = 'HVAC' | 'TR19_DUCTWORK' | 'GAS_SAFETY' | 'FIRE_SAFETY' | 'ELECTRICAL' | 'WATER_HYGIENE' | 'GENERAL';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  isAuthorized: boolean;
}

export interface Incident {
  id: string;
  userId: string;
  timestamp: string;
  description: string;
  imageUri?: string;
  status: 'Pending' | 'Synced' | 'Assigned' | 'Resolved';
  assignedTo?: string;
}

export interface ServiceReport {
  id: string;
  type: ServiceType;
  assetName: string;
  regulation: string;
  lastServiceDate: string;
  nextServiceDueDate: string;
  status: 'Compliant' | 'Urgent Action' | 'Overdue';
}

export interface Qualification {
  id: string;
  type: string;
  expiryDate: string;
  isValid: boolean;
}

export interface Contractor {
  id: string;
  name: string;
  company: string;
  specialism: ServiceType;
  qualifications: Qualification[];
}