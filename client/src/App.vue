<!-- 应用根组件：路由出口 + 底部导航栏 -->
<template>
  <div class="app-root">
    <router-view v-slot="{ Component }">
      <keep-alive :include="['Home', 'History']">
        <component :is="Component" />
      </keep-alive>
    </router-view>

    <!-- 仅主功能页（首页/记录/我的）显示底部 TabBar -->
    <van-tabbar v-if="showTab" route>
      <van-tabbar-item to="/" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item to="/history" icon="orders-o">记录</van-tabbar-item>
      <van-tabbar-item to="/profile" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const showTab = computed(() => !!route.meta.tab);
</script>
