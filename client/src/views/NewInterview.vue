<!-- 新建面试：选择岗位 / 难度 / 轮数 / 可选 JD -->
<template>
  <div class="page new">
    <van-nav-bar title="新建面试" left-arrow @click-left="$router.back()" />

    <div class="section-title">🎯 面试岗位</div>
    <van-cell-group inset>
      <van-field v-model="position" placeholder="如：Java后端开发工程师" maxlength="30" />
    </van-cell-group>
    <div class="new__chips">
      <van-tag
        v-for="p in presets"
        :key="p"
        :type="position === p ? 'primary' : 'default'"
        :plain="position !== p"
        size="medium"
        @click="position = p"
      >
        {{ p }}
      </van-tag>
    </div>

    <div class="section-title">🔥 面试难度</div>
    <div class="new__difficulty">
      <div
        v-for="d in difficulties"
        :key="d.value"
        :class="['new__diff', { active: difficulty === d.value }]"
        @click="difficulty = d.value"
      >
        <p class="new__diff-name">{{ d.label }}</p>
        <p class="new__diff-desc">{{ d.desc }}</p>
      </div>
    </div>

    <div class="section-title">🔢 面试轮数</div>
    <van-cell-group inset>
      <van-cell title="题目数量">
        <template #value>
          <van-stepper v-model="rounds" :min="1" :max="10" />
        </template>
      </van-cell>
    </van-cell-group>

    <div class="section-title">📄 岗位 JD / 简历（可选）</div>
    <van-cell-group inset>
      <van-field
        v-model="jdText"
        type="textarea"
        rows="3"
        autosize
        maxlength="800"
        show-word-limit
        placeholder="粘贴岗位要求或你的简历，AI 会据此个性化出题"
      />
    </van-cell-group>

    <div class="new__footer">
      <van-button
        type="primary"
        block
        round
        :loading="loading"
        loading-text="AI 正在准备第一题…"
        @click="start"
      >
        开始面试
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import api from '../api';

const router = useRouter();
const presets = [
  'Java后端开发',
  '前端开发',
  '算法工程师',
  '产品经理',
  '数据分析师',
  '测试工程师',
  '运维工程师',
  'UI设计师',
];
const difficulties = [
  { value: '初级', label: '初级', desc: '校招 / 实习' },
  { value: '中级', label: '中级', desc: '1-3 年经验' },
  { value: '高级', label: '高级', desc: '资深 / 专家' },
];
const position = ref('');
const difficulty = ref('中级');
const rounds = ref(5);
const jdText = ref('');
const loading = ref(false);

async function start() {
  if (!position.value.trim()) {
    showToast('请填写或选择面试岗位');
    return;
  }
  loading.value = true;
  try {
    const res = await api.post('/interviews', {
      position: position.value.trim(),
      difficulty: difficulty.value,
      totalRounds: rounds.value,
      jdText: jdText.value,
    });
    router.replace(`/session/${res.id}`);
  } catch (e) {
    /* 错误已统一提示 */
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.new__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px 0;
}
.new__chips :deep(.van-tag) {
  cursor: pointer;
}
.new__difficulty {
  display: flex;
  gap: 10px;
  padding: 0 14px;
}
.new__diff {
  flex: 1;
  background: #fff;
  border: 1.5px solid #eef0f6;
  border-radius: 12px;
  padding: 12px 6px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s;
}
.new__diff.active {
  border-color: var(--brand);
  background: rgba(91, 124, 250, 0.06);
}
.new__diff-name {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 4px;
}
.new__diff.active .new__diff-name {
  color: var(--brand);
}
.new__diff-desc {
  font-size: 11px;
  color: #8a8fa3;
  margin: 0;
}
.new__footer {
  padding: 28px 16px 24px;
}
</style>
