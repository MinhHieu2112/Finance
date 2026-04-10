import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

const getStoredToken = () => {
  if (typeof window === 'undefined') return null;

  try {
    const savedUser = localStorage.getItem('smart_finance_user');
    if (savedUser) {
      return JSON.parse(savedUser)?.token;
    }
  } catch {}

  return localStorage.getItem('token');
};

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const withAuth = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const getApiErrorMessage = (error: unknown, fallback = 'Request failed. Please try again.') => {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string; error?: string } | undefined)?.message
      || (error.response?.data as { message?: string; error?: string } | undefined)?.error;

    return message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};
