import { LoginResponse, Task, Stats, User, Department, Shift, Log } from '../types';

// In a real Vercel deploy, this is usually relative '/api'
// For this demo structure, we assume the backend runs on port 5000 locally or via a proxy
const API_URL = 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('phobbq_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

const handleResponse = async (res: Response) => {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Có lỗi xảy ra');
  }
  return data;
};

// --- AUTH ---
export const apiLogin = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  } catch (error: any) {
    if (error.message === 'Failed to fetch') {
      throw new Error('Không thể kết nối Server. Hãy kiểm tra xem Backend (Port 5000) đã chạy chưa?');
    }
    throw error;
  }
};

// --- TASKS ---
export const getTasks = async (department?: string): Promise<Task[]> => {
  const query = department ? `?department=${department}` : '';
  const res = await fetch(`${API_URL}/tasks${query}`, { headers: getHeaders() });
  return handleResponse(res);
};

export const toggleTask = async (taskId: string, isCompleted: boolean): Promise<Task> => {
  const res = await fetch(`${API_URL}/tasks/${taskId}/toggle`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ isCompleted }),
  });
  return handleResponse(res);
};

// --- STATS & LOGS ---
export const getStats = async (): Promise<Stats> => {
  const res = await fetch(`${API_URL}/stats`, { headers: getHeaders() });
  return handleResponse(res);
};

export const getLogs = async (): Promise<Log[]> => {
  const res = await fetch(`${API_URL}/logs`, { headers: getHeaders() });
  return handleResponse(res);
};

// --- ADMIN SEEDING (Helper) ---
export const seedData = async () => {
    const res = await fetch(`${API_URL}/seed`, { method: 'POST' });
    return handleResponse(res);
};