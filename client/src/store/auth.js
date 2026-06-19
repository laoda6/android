/**
 * 用户认证状态（Pinia）
 * 维护 token 与用户信息，并持久化到 localStorage。
 */
import { defineStore } from 'pinia';
import api from '../api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || 'null'),
  }),
  getters: {
    isLoggedIn: (s) => !!s.token,
  },
  actions: {
    async login(username, password) {
      const data = await api.post('/auth/login', { username, password });
      this._save(data);
    },
    async register(username, password) {
      const data = await api.post('/auth/register', { username, password });
      this._save(data);
    },
    _save({ token, user }) {
      this.token = token;
      this.user = user;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    logout() {
      this.token = '';
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
});
