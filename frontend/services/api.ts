import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

console.log('🌐 API Base URL:', BASE_URL);

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  async (config) => {
    console.log(`➡️  ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 (token expired)
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    console.log('❌ API Error:', error.message, '| code:', error.code, '| url:', error.config?.url);
    if (error.response) {
      console.log('❌ Response status:', error.response.status, '| data:', JSON.stringify(error.response.data));
    }
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error.response?.data || error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  signup: (data: { name: string; email: string; password: string; monthlyIncome?: number }) =>
    api.post('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: Partial<{ name: string; monthlyIncome: number; bankBalance: number; liabilities: number; currency: string }>) =>
    api.put('/auth/me', data),
  getGoogleAuthUrl: () => api.get('/auth/google-url'),
};

// ─── Transactions ─────────────────────────────────────────────────────────────
export const transactionAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => api.get('/transactions', { params }),
  getSummary: () => api.get('/transactions/summary'),
  create: (data: {
    amount: number;
    type?: 'debit' | 'credit';
    category?: string;
    merchant?: string;
    description?: string;
    date?: string;
  }) => api.post('/transactions', data),
  update: (id: string, data: Partial<any>) => api.put(`/transactions/${id}`, data),
  delete: (id: string) => api.delete(`/transactions/${id}`),
};

// ─── Investments ──────────────────────────────────────────────────────────────
export const investmentAPI = {
  getAll: () => api.get('/investments'),
  create: (data: {
    name: string;
    type: string;
    assetClass?: string;
    amountInvested: number;
    units?: number;
    buyPrice?: number;
    currentPrice?: number;
    sipAmount?: number;
    sipFrequency?: string;
    purchaseDate?: string;
  }) => api.post('/investments', data),
  update: (id: string, data: Partial<any>) => api.put(`/investments/${id}`, data),
  delete: (id: string) => api.delete(`/investments/${id}`),
};

// ─── AI ───────────────────────────────────────────────────────────────────────
export const aiAPI = {
  getInsights: () => api.post('/ai/insights', {}),
  chat: (message: string, chatHistory?: Array<{ role: string; content: string }>) =>
    api.post('/ai/chat', { message, chatHistory }),
  getNetWorth: () => api.get('/ai/networth'),
};

// ─── Email ────────────────────────────────────────────────────────────────────
export const emailAPI = {
  getAuthUrl: () => api.get('/email/auth-url'),
  syncEmails: () => api.get('/email/sync'),
  disconnect: () => api.delete('/email/disconnect'),
};

export default api;
