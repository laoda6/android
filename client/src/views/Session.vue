<!-- 面试进行页：与 AI 面试官多轮对话 -->
<template>
  <div class="session">
    <van-nav-bar :title="title" left-arrow @click-left="$router.back()" />
    <van-progress
      :percentage="progress"
      :show-pivot="false"
      stroke-width="3"
      color="#5b7cfa"
      track-color="#e6e9f5"
    />

    <div class="session__body" ref="bodyEl">
      <div v-for="(m, i) in messages" :key="i" :class="['msg', m.role]">
        <div class="msg__avatar">{{ m.role === 'interviewer' ? '🤖' : '🙋' }}</div>
        <div class="msg__bubble">{{ m.content }}</div>
      </div>
      <!-- 面试官思考中 -->
      <div v-if="thinking" class="msg interviewer">
        <div class="msg__avatar">🤖</div>
        <div class="msg__bubble msg__bubble--typing">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>

    <div class="session__footer">
      <template v-if="phase === 'answering'">
        <van-field
          v-model="answer"
          type="textarea"
          rows="1"
          autosize
          :disabled="thinking"
          placeholder="输入你的回答…"
          class="session__input"
        />
        <van-button
          type="primary"
          round
          :loading="thinking"
          :disabled="!answer.trim()"
          @click="send"
        >
          发送
        </van-button>
      </template>
      <van-button
        v-else-if="phase === 'toFinish'"
        type="success"
        block
        round
        :loading="finishing"
        loading-text="AI 正在生成评估报告…"
        @click="finish"
      >
        完成面试，查看评估报告
      </van-button>
      <div v-else class="muted text-center" style="width: 100%">加载中…</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../api';

const route = useRoute();
const router = useRouter();
const id = route.params.id;

const interview = ref(null);
const messages = ref([]);
const answer = ref('');
const thinking = ref(false); // 等待 AI 出下一题
const finishing = ref(false); // 生成评估报告
const bodyEl = ref(null);

const totalRounds = computed(() => interview.value?.total_rounds || 0);
const answeredCount = computed(() => messages.value.filter((m) => m.role === 'candidate').length);

// 当前阶段：answering=等待作答；toFinish=已答完待评估；loading=未就绪
const phase = computed(() => {
  if (!interview.value) return 'loading';
  const last = messages.value[messages.value.length - 1];
  if (answeredCount.value >= totalRounds.value && last?.role === 'candidate') return 'toFinish';
  if (last?.role === 'interviewer') return 'answering';
  return 'loading';
});

const title = computed(() => {
  if (!interview.value) return '面试中';
  const cur = Math.min(answeredCount.value + (phase.value === 'answering' ? 1 : 0), totalRounds.value);
  return `第 ${cur}/${totalRounds.value} 轮`;
});
const progress = computed(() =>
  totalRounds.value ? Math.round((answeredCount.value / totalRounds.value) * 100) : 0,
);

async function load() {
  const res = await api.get(`/interviews/${id}`);
  interview.value = res.interview;
  messages.value = res.messages.map((m) => ({ role: m.role, content: m.content }));
  // 已结束的面试直接跳到评估报告
  if (res.interview.status === 'finished') {
    router.replace(`/result/${id}`);
    return;
  }
  scrollToBottom();
}

async function send() {
  const content = answer.value.trim();
  if (!content) return;
  // 先在界面上展示候选人的回答
  messages.value.push({ role: 'candidate', content });
  answer.value = '';
  scrollToBottom();
  // 若还没到最后一轮，将出现下一题，显示"思考中"动画
  thinking.value = answeredCount.value < totalRounds.value;
  try {
    const res = await api.post(`/interviews/${id}/answer`, { content });
    if (!res.finished) {
      messages.value.push({ role: 'interviewer', content: res.question });
    }
  } catch (e) {
    // 失败则回滚刚加入的回答，方便重试
    messages.value.pop();
    answer.value = content;
  } finally {
    thinking.value = false;
    scrollToBottom();
  }
}

async function finish() {
  finishing.value = true;
  try {
    await api.post(`/interviews/${id}/finish`);
    router.replace(`/result/${id}`);
  } catch (e) {
    finishing.value = false;
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (bodyEl.value) bodyEl.value.scrollTop = bodyEl.value.scrollHeight;
  });
}

onMounted(load);
</script>

<style scoped>
.session {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f3f4f8;
}
.session__body {
  flex: 1;
  overflow-y: auto;
  padding: 14px 12px 8px;
}
.msg {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  align-items: flex-start;
}
.msg.candidate {
  flex-direction: row-reverse;
}
.msg__avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(31, 35, 48, 0.08);
}
.msg__bubble {
  max-width: 74%;
  padding: 10px 13px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
.msg.interviewer .msg__bubble {
  background: #fff;
  border-top-left-radius: 2px;
  color: #1f2330;
}
.msg.candidate .msg__bubble {
  background: linear-gradient(135deg, #5b7cfa, #6d6bfb);
  color: #fff;
  border-top-right-radius: 2px;
}
/* 思考中三点动画 */
.msg__bubble--typing {
  display: flex;
  gap: 4px;
  align-items: center;
}
.msg__bubble--typing span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #bcc1d4;
  animation: blink 1.2s infinite both;
}
.msg__bubble--typing span:nth-child(2) {
  animation-delay: 0.2s;
}
.msg__bubble--typing span:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes blink {
  0%,
  80%,
  100% {
    opacity: 0.3;
  }
  40% {
    opacity: 1;
  }
}
.session__footer {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px 12px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1px solid #eef0f6;
}
.session__input {
  flex: 1;
  background: #f3f4f8;
  border-radius: 10px;
}
</style>
