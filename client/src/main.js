/**
 * 前端应用入口
 * 装配 Vue 应用：Pinia 状态管理、Vue Router 路由、Vant 移动端 UI 组件库。
 */
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Vant from 'vant';
import 'vant/lib/index.css';
import router from './router';
import App from './App.vue';
import './style.css';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(Vant);
app.mount('#app');
