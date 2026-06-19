<!-- 登录 / 注册页 -->
<template>
  <div class="login">
    <div class="login__hero">
      <div class="login__logo">🎯</div>
      <h1 class="login__title">AI 模拟面试官</h1>
      <p class="login__slogan">AI 出题 · 智能追问 · 多维评估</p>
    </div>

    <div class="login__panel card">
      <div class="login__tabs">
        <span :class="['login__tab', { active: mode === 'login' }]" @click="mode = 'login'">登录</span>
        <span :class="['login__tab', { active: mode === 'register' }]" @click="mode = 'register'">注册</span>
      </div>

      <van-cell-group inset>
        <van-field v-model="username" left-icon="manager-o" placeholder="请输入用户名" clearable />
        <van-field v-model="password" type="password" left-icon="lock" placeholder="请输入密码" />
      </van-cell-group>

      <van-button class="login__submit" type="primary" block round :loading="loading" @click="submit">
        {{ mode === 'login' ? '登 录' : '注 册' }}
      </van-button>

      <p class="login__switch muted">
        {{ mode === 'login' ? '还没有账号？' : '已有账号？' }}
        <a @click="mode = mode === 'login' ? 'register' : 'login'">
          {{ mode === 'login' ? '立即注册' : '去登录' }}
        </a>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import { useAuthStore } from '../store/auth';

const router = useRouter();
const auth = useAuthStore();
const mode = ref('login');
const username = ref('');
const password = ref('');
const loading = ref(false);

async function submit() {
  if (!username.value || !password.value) {
    showToast('请输入用户名和密码');
    return;
  }
  loading.value = true;
  try {
    if (mode.value === 'login') await auth.login(username.value, password.value);
    else await auth.register(username.value, password.value);
    showToast({ type: 'success', message: mode.value === 'login' ? '登录成功' : '注册成功' });
    router.replace('/');
  } catch (e) {
    /* 错误提示已由 axios 拦截器统一处理 */
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login {
  min-height: 100vh;
  background: linear-gradient(160deg, #5b7cfa 0%, #7c5bfa 42%, #f3f4f8 42%);
}
.login__hero {
  padding: 64px 0 36px;
  text-align: center;
  color: #fff;
}
.login__logo {
  font-size: 56px;
}
.login__title {
  font-size: 26px;
  font-weight: 700;
  margin: 10px 0 6px;
  letter-spacing: 2px;
}
.login__slogan {
  font-size: 13px;
  opacity: 0.92;
}
.login__panel {
  margin: 0 22px;
  padding: 24px 14px 26px;
}
.login__tabs {
  display: flex;
  justify-content: center;
  gap: 36px;
  margin-bottom: 20px;
}
.login__tab {
  font-size: 17px;
  color: #8a8fa3;
  padding-bottom: 6px;
  cursor: pointer;
  position: relative;
}
.login__tab.active {
  color: #1f2330;
  font-weight: 700;
}
.login__tab.active::after {
  content: '';
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 0;
  width: 22px;
  height: 3px;
  border-radius: 2px;
  background: var(--brand);
}
.login__submit {
  margin-top: 24px;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
}
.login__switch {
  text-align: center;
  margin-top: 16px;
  font-size: 13px;
}
.login__switch a {
  color: var(--brand);
}
</style>
