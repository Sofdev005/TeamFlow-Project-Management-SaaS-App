import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('teamflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('teamflow_token');
      localStorage.removeItem('teamflow_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/** Extract a human-readable message from an Axios error. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { title?: string; message?: string; detail?: string; errors?: Record<string, string[]> }
      | string
      | undefined;

    if (typeof data === 'string' && data) return data;
    if (data && typeof data === 'object') {
      if (data.title) return data.title;
      if (data.message) return data.message;
      if (data.detail) return data.detail;
      if (data.errors) {
        const first = Object.values(data.errors).flat()[0];
        if (first) return first;
      }
    }
    if (error.code === 'ERR_NETWORK') {
      return 'Cannot reach the API server. Is the backend running?';
    }
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

/** True when the failure is a missing endpoint / wrong method (safe to fall back). */
export function isRoutingError(error: unknown): boolean {
  return (
    axios.isAxiosError(error) &&
    !!error.response &&
    [404, 405].includes(error.response.status)
  );
}

export default apiClient;
