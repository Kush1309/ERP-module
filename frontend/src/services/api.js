import axios from 'axios';
import { API_BASE_URL } from '../constants/api';
const AUTH_TOKEN_KEY = 'school_erp_access_token';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthRoute = error.config?.url?.includes('/auth/login');

      if (!isAuthRoute) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem('school_erp_auth_user');

        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
