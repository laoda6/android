/**
 * Axios 封装
 * - 统一请求前缀 /api（开发环境由 Vite 代理到后端）
 * - 请求拦截器自动附加 JWT
 * - 响应拦截器统一错误提示与 401 跳登录
 */
import axios from 'axios';
import { showToast } from 'vant';
import router from '../router';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 60000, // 大模型评估可能耗时十余秒，超时设置宽松一些
});

// 请求拦截：携带 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 响应拦截：直接返回 data；统一错误处理
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const status = err.response?.status;
    const msg = err.response?.data?.error || err.message || '网络请求失败';
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (router.currentRoute.value.name !== 'login') router.replace('/login');
    } else {
      showToast(msg);
    }
    return Promise.reject(new Error(msg));
  },
);

export default api;
