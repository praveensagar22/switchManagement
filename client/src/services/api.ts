import axios from 'axios';
import {
  SwitchItem,
  InterfaceItem,
  AlertItem,
  PortEventItem,
  UserItem,
  SystemHealthData
} from '../types/index.ts';

export const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token expiry handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If unauthorized and not on login page, clear token
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('auth_token');
      }
    }
    return Promise.reject(error);
  }
);

// Typed API Service Methods
export const ApiService = {
  // Auth
  login: async (credentials: { email: string; password: string }) => {
    const res = await api.post<{ success: boolean; data: { token: string; user: UserItem } }>(
      '/auth/login',
      credentials
    );
    return res.data.data;
  },
  getMe: async () => {
    const res = await api.get<{ success: boolean; data: UserItem }>('/auth/me');
    return res.data.data;
  },
  seedAdmin: async () => {
    const res = await api.post<{ success: boolean; message: string; data?: any }>('/system/seed-admin');
    return res.data;
  },

  // Switches
  getSwitches: async () => {
    const res = await api.get<{ success: boolean; count: number; data: SwitchItem[] }>('/switches');
    return res.data.data;
  },
  getSwitch: async (id: string) => {
    const res = await api.get<{ success: boolean; data: SwitchItem }>(`/switches/${id}`);
    return res.data.data;
  },
  createSwitch: async (data: any) => {
    const res = await api.post<{ success: boolean; data: SwitchItem }>('/switches', data);
    return res.data.data;
  },
  updateSwitch: async (id: string, data: any) => {
    const res = await api.put<{ success: boolean; data: SwitchItem }>(`/switches/${id}`, data);
    return res.data.data;
  },
  deleteSwitch: async (id: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(`/switches/${id}`);
    return res.data;
  },
  testConnection: async (data: any) => {
    const res = await api.post<{ success: boolean; data: { success: boolean; sysDescr?: string; error?: string } }>(
      '/switches/test-connection',
      data
    );
    return res.data.data;
  },
  syncSwitch: async (id: string) => {
    const res = await api.post<{ success: boolean; message: string; data: { interfaceCount: number } }>(
      `/switches/${id}/sync`
    );
    return res.data.data;
  },

  // Interfaces
  getInterfacesBySwitch: async (switchId: string, params?: { operStatus?: string; search?: string }) => {
    const res = await api.get<{ success: boolean; count: number; data: InterfaceItem[] }>(
      `/interfaces/switch/${switchId}`,
      { params }
    );
    return res.data.data;
  },
  getInterface: async (id: string) => {
    const res = await api.get<{ success: boolean; data: InterfaceItem }>(`/interfaces/${id}`);
    return res.data.data;
  },
  getInterfaceHistory: async (id: string, limit: number = 50) => {
    const res = await api.get<{ success: boolean; total: number; data: PortEventItem[] }>(
      `/interfaces/${id}/history`,
      { params: { limit } }
    );
    return res.data;
  },

  // Events
  getEvents: async (params?: { switchId?: string; limit?: number; page?: number }) => {
    const res = await api.get<{ success: boolean; total: number; data: PortEventItem[] }>('/events', {
      params
    });
    return res.data;
  },

  // Alerts
  getActiveAlerts: async () => {
    const res = await api.get<{ success: boolean; count: number; data: AlertItem[] }>('/alerts/active');
    return res.data.data;
  },
  getAlertHistory: async (limit: number = 50) => {
    const res = await api.get<{ success: boolean; total: number; data: AlertItem[] }>('/alerts/history', {
      params: { limit }
    });
    return res.data;
  },
  acknowledgeAlert: async (id: string) => {
    const res = await api.patch<{ success: boolean; message: string; data: AlertItem }>(
      `/alerts/${id}/acknowledge`
    );
    return res.data.data;
  },

  // System
  getHealth: async () => {
    const res = await api.get<{ success: boolean; data: SystemHealthData }>('/system/health');
    return res.data.data;
  },
  simulateTrap: async (data: { action: 'linkDown' | 'linkUp'; ifIndex: number; switchIp?: string }) => {
    const res = await api.post<{ success: boolean; message: string }>('/system/simulate-trap', data);
    return res.data;
  }
};
