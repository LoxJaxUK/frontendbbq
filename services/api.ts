import { LoginResponse, Task, Stats, Log, Rule, TrainingVideo, Role } from '../types';

const API_URL = '/api'; // Relative path for Vite proxy

const getHeaders = () => {
  const token = localStorage.getItem('phobbq_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

const handleResponse = async (res: Response) => {
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (!res.ok) throw new Error(data.message || 'Lỗi kết nối');
    return data;
  } catch (e: any) {
    // Log the raw text if parsing fails to see what server returned (e.g. HTML 404)
    console.error("API Error  Raw Response: - api.ts:21", text);
    if (!res.ok) {
        if (res.status === 404) throw new Error('Không tìm thấy API (404). Kiểm tra Backend đã chạy chưa?');
        if (res.status === 504) throw new Error('Không kết nối được tới Backend (504).');
        throw new Error(res.statusText || 'Lỗi Server (Phản hồi không hợp lệ)');
    }
    throw e;
  }
};

// --- AUTH ---
export const apiLogin = async (email: string, password: string): Promise<LoginResponse> => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
};

export const seedData = async () => handleResponse(await fetch(`${API_URL}/seed`, { method: 'POST' }));

// --- TASKS ---
export const getTasks = async (role?: string): Promise<Task[]> => {
  const query = role ? `?role=${role}` : '';
  const res = await fetch(`${API_URL}/tasks${query}`, { headers: getHeaders() });
  return handleResponse(res);
};

export const toggleTask = async (taskId: string, isCompleted: boolean, image?: string): Promise<Task> => {
  const res = await fetch(`${API_URL}/tasks/${taskId}/toggle`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ isCompleted, image }),
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

// --- RULES ---
export const getRules = async (): Promise<Rule[]> => {
  const res = await fetch(`${API_URL}/rules`, { headers: getHeaders() });
  return handleResponse(res);
};

export const updateRule = async (title: string, content: string): Promise<Rule> => {
  const res = await fetch(`${API_URL}/rules`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ title, content })
  });
  return handleResponse(res);
};

// --- VIDEOS ---
export const getVideos = async (): Promise<TrainingVideo[]> => {
  const res = await fetch(`${API_URL}/videos`, { headers: getHeaders() });
  return handleResponse(res);
};

export const addVideo = async (video: Partial<TrainingVideo>): Promise<TrainingVideo> => {
  const res = await fetch(`${API_URL}/videos`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(video)
  });
  return handleResponse(res);
};

export const deleteVideo = async (id: string): Promise<void> => {
  const res = await fetch(`${API_URL}/videos/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return handleResponse(res);
};

// --- ADMIN ---
export const importTasks = async (tasks: Partial<Task>[]) => {
    const res = await fetch(`${API_URL}/tasks/import`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ tasks })
    });
    return handleResponse(res);
};
