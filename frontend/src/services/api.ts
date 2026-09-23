import axios from 'axios';
import {
  Department,
  ClassItem,
  Section,
  Faculty,
  Subject,
  Room,
  Student,
  User,
  Timetable,
  TimetableEntry,
  FacultyScheduleEntry,
  DashboardStats,
  ConflictCheckPayload,
  ConflictResponse
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for attaching JWT Bearer Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('schedura_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for handling 401 unauth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('schedura_token');
      localStorage.removeItem('schedura_user');
      // If not already on login page, redirect
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ==========================================
// AUTH SERVICES
// ==========================================
export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },
  register: async (payload: any) => {
    const res = await api.post('/auth/register', payload);
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  }
};

// ==========================================
// TIMETABLE SERVICES
// ==========================================
export const timetableService = {
  getAll: async (params?: Record<string, any>) => {
    const res = await api.get('/timetables', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get(`/timetables/${id}`);
    return res.data;
  },
  getActive: async (params: {
    departmentId?: string;
    classId: string;
    sectionId: string;
    semester?: number;
    academicYear?: string;
  }) => {
    const res = await api.get('/timetables/active', { params });
    return res.data;
  },
  getVersions: async (classId: string, sectionId: string) => {
    const res = await api.get(`/timetables/versions/${classId}/${sectionId}`);
    return res.data;
  },
  create: async (payload: Partial<Timetable>) => {
    const res = await api.post('/timetables', payload);
    return res.data;
  },
  update: async (id: string, payload: Partial<Timetable>) => {
    const res = await api.put(`/timetables/${id}`, payload);
    return res.data;
  },
  publish: async (id: string) => {
    const res = await api.post(`/timetables/${id}/publish`);
    return res.data;
  },
  archive: async (id: string) => {
    const res = await api.post(`/timetables/${id}/archive`);
    return res.data;
  },
  duplicate: async (id: string) => {
    const res = await api.post(`/timetables/${id}/duplicate`);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/timetables/${id}`);
    return res.data;
  },
  getFacultyAllocation: async (id: string) => {
    const res = await api.get(`/timetables/${id}/faculty-allocation`);
    return res.data;
  },
  checkConflict: async (payload: ConflictCheckPayload): Promise<ConflictResponse> => {
    const res = await api.post('/timetables/check-conflict', payload);
    return res.data;
  },
  syncEntries: async (id: string, entries: any[]) => {
    const res = await api.post(`/timetables/${id}/entries/sync`, { entries });
    return res.data;
  },
  addEntry: async (id: string, entry: any) => {
    const res = await api.post(`/timetables/${id}/entries`, entry);
    return res.data;
  },
  updateEntry: async (id: string, entry: any) => {
    const res = await api.put(`/timetables/entries/${id}`, entry);
    return res.data;
  },
  deleteEntry: async (id: string) => {
    const res = await api.delete(`/timetables/entries/${id}`);
    return res.data;
  }
};

// ==========================================
// MASTER DATA SERVICES
// ==========================================
export const departmentService = {
  getAll: async () => {
    const res = await api.get('/departments');
    return res.data;
  },
  create: async (data: Partial<Department>) => {
    const res = await api.post('/departments', data);
    return res.data;
  },
  update: async (id: string, data: Partial<Department>) => {
    const res = await api.put(`/departments/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/departments/${id}`);
    return res.data;
  }
};

export const classService = {
  getAll: async (params?: Record<string, any>) => {
    const res = await api.get('/classes', { params });
    return res.data;
  },
  create: async (data: Partial<ClassItem>) => {
    const res = await api.post('/classes', data);
    return res.data;
  },
  update: async (id: string, data: Partial<ClassItem>) => {
    const res = await api.put(`/classes/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/classes/${id}`);
    return res.data;
  }
};

export const sectionService = {
  getByClass: async (classId: string) => {
    const res = await api.get(`/classes/${classId}/sections`);
    return res.data;
  },
  getAll: async (params?: Record<string, any>) => {
    const res = await api.get('/sections', { params });
    return res.data;
  },
  create: async (data: Partial<Section>) => {
    const res = await api.post('/sections', data);
    return res.data;
  },
  update: async (id: string, data: Partial<Section>) => {
    const res = await api.put(`/sections/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/sections/${id}`);
    return res.data;
  }
};

export const facultyService = {
  getMySchedule: async () => {
    const res = await api.get('/faculty/me/schedule');
    return res.data;
  },
  getMyInChargeTimetable: async () => {
    const res = await api.get('/faculty/me/in-charge-timetable');
    return res.data;
  },
  getScheduleById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: { faculty: Faculty; entries: FacultyScheduleEntry[] } }>(
      `/faculty/${id}/schedule`
    );
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get(`/faculty/${id}`);
    return res.data;
  },
  getAll: async (params?: Record<string, any>) => {
    const res = await api.get('/faculty', { params });
    return res.data;
  },
  create: async (data: Partial<Faculty>) => {
    const res = await api.post('/faculty', data);
    return res.data;
  },
  update: async (id: string, data: Partial<Faculty>) => {
    const res = await api.put(`/faculty/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/faculty/${id}`);
    return res.data;
  }
};

export const subjectService = {
  getAll: async (params?: Record<string, any>) => {
    const res = await api.get('/subjects', { params });
    return res.data;
  },
  create: async (data: Partial<Subject>) => {
    const res = await api.post('/subjects', data);
    return res.data;
  },
  update: async (id: string, data: Partial<Subject>) => {
    const res = await api.put(`/subjects/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/subjects/${id}`);
    return res.data;
  }
};

export const roomService = {
  getAll: async (params?: Record<string, any>) => {
    const res = await api.get('/rooms', { params });
    return res.data;
  },
  create: async (data: Partial<Room>) => {
    const res = await api.post('/rooms', data);
    return res.data;
  },
  update: async (id: string, data: Partial<Room>) => {
    const res = await api.put(`/rooms/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/rooms/${id}`);
    return res.data;
  }
};

export const userService = {
  getAll: async (params?: Record<string, any>) => {
    const res = await api.get('/users', { params });
    return res.data;
  },
  create: async (data: Partial<User>) => {
    const res = await api.post('/users', data);
    return res.data;
  },
  update: async (id: string, data: Partial<User>) => {
    const res = await api.put(`/users/${id}`, data);
    return res.data;
  },
  toggleStatus: async (id: string) => {
    const res = await api.patch(`/users/${id}/status`);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  }
};

export const studentService = {
  getAll: async (params?: Record<string, any>) => {
    const res = await api.get('/students', { params });
    return res.data;
  }
};

export const statsService = {
  getOverview: async (departmentId?: string) => {
    const res = await api.get('/stats/overview', { params: { departmentId } });
    return res.data;
  }
};
