export enum Role {
  MANAGER = 'manager',
  STAFF = 'staff'
}

export enum Department {
  KITCHEN = 'Bep',
  SERVICE = 'PhucVu'
}

export enum Shift {
  MORNING = 'sang',
  EVENING = 'chieu'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: Department;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  department: Department;
  shift: Shift;
  isCompleted: boolean;
  completedBy?: string; // User ID
  completedByName?: string;
  completedAt?: string; // ISO Date
  updatedAt: string;
}

export interface Log {
  id: string;
  taskId: string;
  taskTitle: string;
  userName: string;
  action: 'complete' | 'undo';
  timestamp: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Stats {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  byUser: { name: string; count: number }[];
  byHour: { hour: string; count: number }[];
}