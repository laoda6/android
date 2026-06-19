<!-- 我的：用户信息、统计卡片、成长曲线、退出登录 -->
<template>
  <div class="page page--tab">
    <div class="gradient-header profile__header">
      <div class="profile__avatar">{{ avatarText }}</div>
      <div>
        <p class="profile__name">{{ username }}</p>
        <p class="profile__motto">坚持练习，offer 在望 🚀</p>
      </div>
    </div>

    <div class="profile__cards">
      <div class="card profile__c"><b>{{ stats.totalInterviews }}</b><span class="muted">总场次</span></div>
      <div class="card profile__c"><b>{{ stats.finishedInterviews }}</b><span class="muted">已完成</span></div>
      <div class="card profile__c"><b>{{ stats.avgScore }}</b><span class="muted">平均分</span></div>
      <div class="card profile__c"><b>{{ stats.bestScore }}</b><span class="muted">最高分</span></div>
    </div>

    <div class="section-title">📈 成长曲线</div>
    <div class="card profile__chart">
      <EChart v-if="hasCurve" :option="curveOption" height="240px" />
      <div v-else class="muted profile__chart-empty">完成面试后即可查看成长曲线</div>
    </div>

    <div class="profile__logout">
      <van-button block round plain type="danger" @click="logout">退出登录</van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';
import { useAuthStore } from '../store/auth';
import EChart from '../components/EChart.vue';

const router = useRouter();
const auth = useAuthStore();
const username = computed(() => auth.user?.username || '同学');
const avatarText = computed(() => (auth.user?.username || 'U').slice(0, 1).toUpperCase());

const stats = ref({ totalInterviews: 0, finishedInterviews: 0, avgScore: 0, bestScore: 0, curve: [] });
const hasCurve = computed(() => (stats.value.curve || []).length > 0);

const curveOption = computed(() => {
  const c = stats.value.curve || [];
  return {
    grid: { left: 34, right: 16, top: 18, bottom: 26 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: c.map((_, i) => `第${i + 1}次`),
      axisLine: { lineStyle: { color: '#dcdfea' } },
      axisLabel: { color: '#8a8fa3', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      splitLine: { lineStyle: { color: '#eef0f6' } },
      axisLabel: { color: '#8a8fa3', fontSize: 11 },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        data: c.map((x) => x.score),
        areaStyle: { color: 'rgba(91,124,250,0.15)' },
        lineStyle: { color: '#5b7cfa', width: 3 },
        itemStyle: { color: '#5b7cfa' },
        symbolSize: 7,
      },
    ],
  };
});

async function load() {
  try {
    stats.value = await api.get('/stats');
  } catch (e) {
    /* 错误已统一提示 */
  }
}
function logout() {
  auth.logout();
  router.replace('/login');
}

onMounted(load);
onActivated(load);
</script>

<style scoped>
.profile__header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 26px 18px;
}
.profile__avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
}
.profile__name {
  font-size: 19px;
  font-weight: 700;
  margin: 0 0 4px;
}
.profile__motto {
  font-size: 13px;
  opacity: 0.9;
  margin: 0;
}
.profile__cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 14px;
}
.profile__c {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}
.profile__c b {
  font-size: 24px;
  color: #1f2330;
}
.profile__c span {
  font-size: 12px;
}
.profile__chart {
  margin: 0 14px;
  padding: 10px 6px;
}
.profile__chart-empty {
  text-align: center;
  padding: 50px 0;
  font-size: 13px;
}
.profile__logout {
  padding: 28px 16px;
}
</style>
