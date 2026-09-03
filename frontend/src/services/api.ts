import axios from 'axios';

export const AUTH_SESSION_EXPIRED_EVENT = 'azaam:auth-session-expired';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || ''}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('azaam_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('azaam_token');
      localStorage.removeItem('azaam_user');
      localStorage.removeItem('azaam_user_role');
      window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  }
);

export default api;
