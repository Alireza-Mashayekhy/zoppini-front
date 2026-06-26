import axios, { InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import { v4 as uuidv4 } from 'uuid';

const getGuestId = (): string => {
  let guestId = Cookies.get('guestId');
  if (!guestId) {
    guestId = uuidv4();
    Cookies.set('guestId', guestId, { expires: 30 }); // ۳۰ روز
  }
  return guestId;
};

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const guestId = getGuestId();
  if (guestId) {
    config.headers['x-guest-id'] = guestId;
  }
  return config;
});

let isRefreshing = false;

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (!isRefreshing) {
          isRefreshing = true;

          await api.post('/auth/refresh');

          isRefreshing = false;
        }

        return api(originalRequest);
      } catch {
        await api.post('/auth/logout').catch(() => {});

        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }

        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);
