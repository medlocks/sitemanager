export type UserRole = 'Manager' | 'Employee' | 'Contractor';

export type ServiceType = 'HVAC' | 'TR19_DUCTWORK' | 'GAS_SAFETY' | 'FIRE_SAFETY' | 'ELECTRICAL' | 'WATER_HYGIENE' | 'GENERAL';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  isAuthorized: boolean;
}

export interface Incident {
  id: string;
  created_at: string; 
  user_id: string;   
  description: string;
  location: string;
  status: 'Pending' | 'Assigned' | 'Resolved';
  assigned_to?: string; 
  image_url?: string;
}

export interface ServiceReport {
  id: string;
  assetName: string;
  type: string;
  status: 'Compliant' | 'Non-Compliant';
  lastServiceDate: string;
  nextServiceDueDate: string;
  regulation: string;
  assigned_to?: string;      // Add this (optional)
  task_status?: string;     // Add this (optional)
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