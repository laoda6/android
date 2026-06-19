<!-- 评估报告页：总分、能力雷达、维度明细、亮点/改进、逐题点评、总评 -->
<template>
  <div class="page result">
    <van-nav-bar title="评估报告" left-arrow @click-left="goHome" />

    <div v-if="loading" class="result__loading">
      <van-loading size="28px">{{ loadingText }}</van-loading>
    </div>

    <template v-else-if="evaluation">
      <!-- 总分 -->
      <div class="result__hero card">
        <div class="result__ring" :style="ringStyle">
          <div class="result__ring-inner">
            <div class="result__num">{{ evaluation.totalScore }}</div>
            <div class="result__cap muted">综合得分</div>
          </div>
        </div>
        <p class="result__verdict" :style="{ color: scoreColor(evaluation.totalScore) }">
          {{ verdict }}
        </p>
        <p class="muted result__pos">{{ interview.position }} · {{ interview.difficulty }}</p>
      </div>

      <!-- 能力雷达 -->
      <div class="section-title">📊 能力雷达</div>
      <div class="card" style="padding: 8px 4px">
        <EChart :option="radarOption" height="290px" />
      </div>

      <!-- 维度明细 -->
      <div class="section-title">📈 维度评分</div>
      <div class="card result__dims">
        <div v-for="d in evaluation.dimensions" :key="d.name" class="result__dim">
          <div class="result__dim-top">
            <span>{{ d.name }}</span>
            <b :style="{ color: scoreColor(d.score) }">{{ d.score }}</b>
          </div>
          <van-progress
            :percentage="d.score"
            :show-pivot="false"
            :color="scoreColor(d.score)"
            track-color="#eef0f6"
            stroke-width="6"
          />
          <p class="result__dim-comment muted">{{ d.comment }}</p>
        </div>
      </div>

      <!-- 亮点 -->
      <div class="section-title">✨ 亮点</div>
      <div class="card result__list">
        <div v-for="(s, i) in evaluation.strengths" :key="i" class="result__li">
          <van-icon name="passed" color="#07c160" />
          <span>{{ s }}</span>
        </div>
        <div v-if="!evaluation.strengths.length" class="muted result__none">暂无</div>
      </div>

      <!-- 改进建议 -->
      <div class="section-title">🛠 改进建议</div>
      <div class="card result__list">
        <div v-for="(s, i) in evaluation.improvements" :key="i" class="result__li">
          <van-icon name="warning-o" color="#ff976a" />
          <span>{{ s }}</span>
        </div>
        <div v-if="!evaluation.improvements.length" class="muted result__none">暂无</div>
      </div>

      <!-- 逐题点评 -->
      <template v-if="evaluation.perQuestion && evaluation.perQuestion.length">
        <div class="section-title">📝 逐题点评</div>
        <div class="card">
          <van-collapse v-model="active">
            <van-collapse-item v-for="q in evaluation.perQuestion" :key="q.round" :name="q.round">
              <template #title>
                第 {{ q.round }} 题 ·
                <span :style="{ color: scoreColor(q.score) }">{{ q.score }} 分</span>
              </template>
              {{ q.comment }}
            </van-collapse-item>
          </van-collapse>
        </div>
      </template>

      <!-- 总体评价 -->
      <div class="section-title">🧾 总体评价</div>
      <div class="card result__summary">{{ evaluation.summary }}</div>

      <div class="result__actions">
        <van-button block round type="primary" @click="goHome">返回首页</van-button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../api';
import EChart from '../components/EChart.vue';

const route = useRoute();
const router = useRouter();
const id = route.params.id;

const loading = ref(true);
const loadingText = ref('加载中…');
const interview = ref(null);
const evaluation = ref(null);
const active = ref([]);

const verdict = computed(() => {
  const s = evaluation.value?.totalScore || 0;
  if (s >= 85) return '表现优秀 🎉';
  if (s >= 70) return '表现良好 👍';
  if (s >= 60) return '基本合格';
  return '仍需努力 💪';
});

const ringStyle = computed(() => {
  const s = evaluation.value?.totalScore || 0;
  return { background: `conic-gradient(${scoreColor(s)} ${s * 3.6}deg, #eef0f6 0deg)` };
});

const radarOption = computed(() => {
  const dims = evaluation.value?.dimensions || [];
  return {
    radar: {
      indicator: dims.map((d) => ({ name: d.name, max: 100 })),
      radius: '64%',
      splitNumber: 4,
      axisName: { color: '#6b6f80', fontSize: 12 },
      splitLine: { lineStyle: { color: '#e6e9f5' } },
      splitArea: { areaStyle: { color: ['#fff', '#f7f8fc'] } },
      axisLine: { lineStyle: { color: '#e6e9f5' } },
    },
    series: [
      {
        type: 'radar',
        data: [{ value: dims.map((d) => d.score), name: '能力得分' }],
        areaStyle: { color: 'rgba(91,124,250,0.25)' },
        lineStyle: { color: '#5b7cfa', width: 2 },
        itemStyle: { color: '#5b7cfa' },
      },
    ],
  };
});

function scoreColor(v) {
  if (v >= 80) return '#07c160';
  if (v >= 60) return '#ff976a';
  return '#ee0a24';
}
function goHome() {
  router.push('/');
}

onMounted(async () => {
  try {
    const res = await api.get(`/interviews/${id}`);
    interview.value = res.interview;
    if (res.evaluation) {
      evaluation.value = res.evaluation;
    } else {
      // 兜底：尚未评估则触发一次评估（如从面试页直接进入）
      loadingText.value = 'AI 正在生成评估报告…';
      const fin = await api.post(`/interviews/${id}/finish`);
      evaluation.value = fin.evaluation;
    }
  } catch (e) {
    /* 错误已统一提示 */
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.result {
  padding-bottom: 24px;
}
.result__loading {
  text-align: center;
  padding: 120px 0;
}
.result__hero {
  margin: 14px;
  padding: 24px 16px 18px;
  text-align: center;
}
.result__ring {
  width: 132px;
  height: 132px;
  border-radius: 50%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}
.result__ring-inner {
  width: 106px;
  height: 106px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.result__num {
  font-size: 40px;
  font-weight: 800;
  line-height: 1;
  color: #1f2330;
}
.result__cap {
  font-size: 12px;
  margin-top: 4px;
}
.result__verdict {
  font-size: 18px;
  font-weight: 700;
  margin: 16px 0 4px;
}
.result__pos {
  font-size: 13px;
  margin: 0;
}
.result__dims {
  padding: 6px 16px;
}
.result__dim {
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f8;
}
.result__dim:last-child {
  border-bottom: none;
}
.result__dim-top {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-bottom: 8px;
}
.result__dim-top b {
  font-size: 16px;
}
.result__dim-comment {
  font-size: 12px;
  margin: 8px 0 0;
  line-height: 1.5;
}
.result__list {
  padding: 8px 16px;
}
.result__li {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 8px 0;
  font-size: 14px;
  line-height: 1.5;
}
.result__li .van-icon {
  margin-top: 3px;
  flex-shrink: 0;
}
.result__none {
  padding: 8px 0;
  font-size: 13px;
}
.result__summary {
  margin: 0 14px;
  padding: 16px;
  font-size: 14px;
  line-height: 1.7;
  color: #3a3f52;
}
.result__actions {
  padding: 22px 16px 0;
}
.card {
  margin-left: 14px;
  margin-right: 14px;
}
</style>
