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

const getStringValue = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized ? normalized : undefined;
};

export const withAuth = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const getApiErrorMessage = (error: unknown, fallback = 'Request failed. Please try again.') => {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as { message?: unknown; error?: unknown } | undefined;
    return getStringValue(payload?.message) || getStringValue(payload?.error) || getStringValue(error.message) || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

export const getApiSuccessMessage = (data: unknown, fallback = 'Success') => {
  if (!data || typeof data !== 'object') {
    return fallback;
  }

  const message = getStringValue((data as Record<string, unknown>).message);
  return message || fallback;
};
