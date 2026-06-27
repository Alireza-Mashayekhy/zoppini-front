// lib/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import { v4 as uuidv4 } from 'uuid';

const getGuestId = (): string => {
  let guestId = Cookies.get('guestId');
  if (!guestId) {
    guestId = uuidv4();
    Cookies.set('guestId', guestId, { expires: 30 });
  }
  return guestId;
};

// دریافت توکن از کوکی
const getAccessToken = (): string | undefined => {
  return Cookies.get('access_token');
};

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// Interceptor درخواست
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const guestId = getGuestId();
  if (guestId) {
    config.headers['x-guest-id'] = guestId;
  }
  return config;
});

// مدیریت رفرش توکن با صف
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: Error | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(null);
    }
  });
  failedQueue = [];
};

// Interceptor پاسخ
api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // اگر خطای ۴۰۱ نباشد یا قبلاً تلاش شده باشد
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // بررسی وجود توکن - اگر توکنی وجود نداشته باشد، رفرش بی‌معناست
    const token = getAccessToken();
    if (!token) {
      // اگر توکن وجود ندارد، خطا را برگردان (بدون رفرش)
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // اگر در حال رفرش هستیم، درخواست را به صف اضافه کن
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => api(originalRequest))
        .catch(err => Promise.reject(err));
    }

    isRefreshing = true;

    try {
      // درخواست رفرش
      await api.post('/auth/refresh');
      processQueue(null);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError as Error);
      await api.post('/auth/logout').catch(() => {});
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
