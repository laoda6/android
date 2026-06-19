<!-- 首页：问候、统计概览、开始面试入口、最近面试 -->
<template>
  <div class="page page--tab">
    <div class="gradient-header home__header">
      <div class="home__hello">
        <div>
          <p class="home__greet">{{ greet }}，{{ username }} 👋</p>
          <p class="home__tip">准备好迎接今天的模拟面试了吗？</p>
        </div>
        <div class="home__avatar">{{ avatarText }}</div>
      </div>

      <div class="home__stats card">
        <div class="home__stat">
          <b>{{ stats.totalInterviews }}</b><span class="muted">面试场次</span>
        </div>
        <div class="home__divider"></div>
        <div class="home__stat">
          <b>{{ stats.avgScore }}</b><span class="muted">平均分</span>
        </div>
        <div class="home__divider"></div>
        <div class="home__stat">
          <b>{{ stats.bestScore }}</b><span class="muted">最高分</span>
        </div>
      </div>
    </div>

    <div class="home__cta card" @click="$router.push('/new')">
      <div class="home__cta-icon">🤖</div>
      <div class="home__cta-text">
        <p class="home__cta-title">开始模拟面试</p>
        <p class="home__cta-sub muted">选择岗位，AI 面试官即刻上线</p>
      </div>
      <van-icon name="arrow" size="18" color="#bcc1d4" />
    </div>

    <div class="section-title">📋 最近面试</div>
    <div v-if="recent.length === 0" class="home__empty muted">
      暂无面试记录，点击上方开始第一场吧
    </div>
    <div v-else>
      <InterviewItem v-for="it in recent" :key="it.id" :item="it" @click="open(it)" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';
import { useAuthStore } from '../store/auth';
import InterviewItem from '../components/InterviewItem.vue';

defineOptions({ name: 'Home' });

const router = useRouter();
const auth = useAuthStore();
const username = computed(() => auth.user?.username || '同学');
const avatarText = computed(() => (auth.user?.username || 'U').slice(0, 1).toUpperCase());
const greet = computed(() => {
  const h = new Date().getHours();
  if (h < 6) return '夜深了';
  if (h < 12) return '早上好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
});

const stats = ref({ totalInterviews: 0, avgScore: 0, bestScore: 0 });
const recent = ref([]);

async function load() {
  try {
    const [s, list] = await Promise.all([api.get('/stats'), api.get('/interviews')]);
    stats.value = s;
    recent.value = (list.interviews || []).slice(0, 4);
  } catch (e) {
    /* 错误已统一提示 */
  }
}
function open(it) {
  router.push(it.status === 'finished' ? `/result/${it.id}` : `/session/${it.id}`);
}

onMounted(load);
onActivated(load); // keep-alive 返回时刷新
</script>

<style scoped>
.home__header {
  padding-bottom: 46px;
}
.home__hello {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.home__greet {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 6px;
}
.home__tip {
  font-size: 13px;
  opacity: 0.9;
  margin: 0;
}
.home__avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
}
.home__stats {
  display: flex;
  align-items: center;
  margin-top: 18px;
  padding: 16px 0;
}
.home__stat {
  flex: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.home__stat b {
  font-size: 22px;
  color: #1f2330;
}
.home__stat span {
  font-size: 12px;
}
.home__divider {
  width: 1px;
  height: 28px;
  background: #eef0f6;
}
.home__cta {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: -28px 14px 4px;
  padding: 18px 16px;
  position: relative;
}
.home__cta-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: linear-gradient(135deg, #5b7cfa, #7c5bfa);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}
.home__cta-text {
  flex: 1;
}
.home__cta-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 4px;
}
.home__cta-sub {
  font-size: 12px;
  margin: 0;
}
.home__empty {
  text-align: center;
  padding: 40px 0;
  font-size: 13px;
}
</style>
