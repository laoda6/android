import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Vite 配置
// - base: './' 使用相对路径，便于后续 Capacitor 打包为 Android 应用
// - server.proxy: 开发环境把 /api 代理到后端，规避跨域
export default defineConfig({
  plugins: [vue()],
  base: './',
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
});
