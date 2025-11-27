export enum Role {
  ADMIN = 'admin',
  MANAGER = 'manager',
  KITCHEN = 'kitchen', // Bep
  SERVICE = 'service'  // Phuc Vu
}

export enum TaskStatus {
  PENDING = 'pending', // Việc mới/Phải làm
  DONE = 'done',       // Đã xong
  LATE = 'late'        // Trễ hạn
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  jobPosition?: string; // e.g., "Bếp Trưởng", "Thu Ngân"
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  role: Role; // Checklist này thuộc về role nào
  deadline?: string; // Giờ kết thúc (HH:mm)
  status: TaskStatus;
  isCompleted: boolean;
  completedBy?: string; 
  completedByName?: string;
  completedAt?: string; 
  image?: string; // Base64 string of uploaded proof
  updatedAt: string;
}

export interface Log {
  id: string;
  taskId: string;
  taskTitle: string;
  userName: string;
  action: 'complete' | 'undo' | 'upload_image';
  timestamp: string;
}

export interface Rule {
  id: string;
  title: string;
  content: string; // HTML or Markdown
  updatedAt: string;
  updatedBy: string;
}

export interface TrainingVideo {
  id: string;
  title: string;
  youtubeUrl: string; // https://www.youtube.com/watch?v=...
  description?: string;
  order: number;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Stats {
  totalTasks: number;
  completedTasks: number;
  lateTasks: number;
  completionRate: number;
  byUser: { name: string; count: number }[];
  byHour: { hour: string; count: number }[];
}