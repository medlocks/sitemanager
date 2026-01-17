import { User, UserRole } from '../types';

export const mockLogin = (role: UserRole): User => {
  return {
    id: Math.random().toString(36).substr(2, 9),
    name: `Raytheon ${role}`,
    role: role,
    isAuthorized: true,
  };
};