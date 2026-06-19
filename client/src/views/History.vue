<!-- 面试记录页：历史列表，支持左滑删除、下拉刷新 -->
<template>
  <div class="page page--tab">
    <div class="gradient-header history__header">
      <h2 class="history__title">面试记录</h2>
      <p class="history__sub">共 {{ list.length }} 场面试</p>
    </div>

    <van-pull-refresh v-model="refreshing" @refresh="load">
      <div v-if="list.length === 0 && !loading" class="muted history__empty">暂无面试记录</div>
      <van-swipe-cell v-for="it in list" :key="it.id">
        <InterviewItem :item="it" @click="open(it)" />
        <template #right>
          <div class="history__del" @click="remove(it)">删除</div>
        </template>
      </van-swipe-cell>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated } from 'vue';
import { useRouter } from 'vue-router';
import { showConfirmDialog, showToast } from 'vant';
import api from '../api';
import InterviewItem from '../components/InterviewItem.vue';

defineOptions({ name: 'History' });

const router = useRouter();
const list = ref([]);
const loading = ref(false);
const refreshing = ref(false);

async function load() {
  loading.value = true;
  try {
    const res = await api.get('/interviews');
    list.value = res.interviews || [];
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}
function open(it) {
  router.push(it.status === 'finished' ? `/result/${it.id}` : `/session/${it.id}`);
}
async function remove(it) {
  try {
    await showConfirmDialog({ title: '删除面试', message: `确定删除「${it.position}」这场面试吗？` });
  } catch {
    return; // 用户取消
  }
  await api.delete(`/interviews/${it.id}`);
  showToast('已删除');
  load();
}

onMounted(load);
onActivated(load);
</script>

<style scoped>
.history__header {
  padding: 22px 18px 20px;
}
.history__title {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 4px;
}
.history__sub {
  font-size: 13px;
  opacity: 0.9;
  margin: 0;
}
.history__empty {
  text-align: center;
  padding: 70px 0;
  font-size: 13px;
}
.history__del {
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 22px;
  margin: 10px 14px 10px 0;
  background: #ee0a24;
  color: #fff;
  border-radius: 14px;
  font-size: 14px;
}
</style>
