/**
 * 路由配置
 * 采用 hash 模式，方便静态部署与 Capacitor 打包后在 file:// 下运行。
 * 通过全局前置守卫做登录态拦截。
 */
import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue'),
    meta: { public: true },
  },
  { path: '/', name: 'home', component: () => import('../views/Home.vue'), meta: { tab: 'home' } },
  { path: '/new', name: 'new', component: () => import('../views/NewInterview.vue') },
  { path: '/session/:id', name: 'session', component: () => import('../views/Session.vue') },
  { path: '/result/:id', name: 'result', component: () => import('../views/Result.vue') },
  {
    path: '/history',
    name: 'history',
    component: () => import('../views/History.vue'),
    meta: { tab: 'history' },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/Profile.vue'),
    meta: { tab: 'profile' },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// 全局前置守卫：未登录只能访问 public 页面；已登录访问登录页则跳首页
router.beforeEach((to) => {
  const token = localStorage.getItem('token');
  if (!to.meta.public && !token) return { name: 'login' };
  if (to.name === 'login' && token) return { name: 'home' };
});

export default router;
