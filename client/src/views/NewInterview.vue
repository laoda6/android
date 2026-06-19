<!-- 新建面试：选择岗位 / 难度 / 轮数 / AI 模型 / 可选 JD 或简历文件 -->
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

    <div class="section-title">🧠 AI 模型</div>
    <van-cell-group inset>
      <van-cell is-link center @click="showModelSheet = true">
        <template #title>
          <span class="new__model-label">{{ selectedModel ? selectedModel.label : '加载中…' }}</span>
          <van-tag v-if="selectedModel && selectedModel.recommended" type="primary" class="new__model-tag">最快</van-tag>
        </template>
        <template #label v-if="selectedModel">{{ selectedModel.vendor }} · {{ selectedModel.id }}</template>
      </van-cell>
    </van-cell-group>

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
        maxlength="4000"
        show-word-limit
        placeholder="粘贴岗位要求或你的简历，AI 会据此个性化出题"
      />
    </van-cell-group>
    <div class="new__upload">
      <input
        ref="fileInput"
        type="file"
        accept=".pdf,.docx,.txt"
        style="display: none"
        @change="onFile"
      />
      <van-button
        size="small"
        plain
        type="primary"
        round
        :loading="uploading"
        loading-text="正在解析…"
        @click="$refs.fileInput.click()"
      >
        📎 上传简历文件（PDF / Word / TXT）
      </van-button>
      <span v-if="resumeName" class="new__file">已导入：{{ resumeName }}</span>
    </div>

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

    <!-- 模型选择弹窗 -->
    <van-action-sheet
      v-model:show="showModelSheet"
      :actions="modelActions"
      cancel-text="取消"
      description="按响应速度排序，可按需选择"
      close-on-click-action
      @select="onSelectModel"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
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

// 模型选择
const models = ref([]);
const modelId = ref('');
const showModelSheet = ref(false);
const selectedModel = computed(() => models.value.find((m) => m.id === modelId.value));
const modelActions = computed(() =>
  models.value.map((m) => ({
    name: m.label + (m.recommended ? ' ⚡' : ''),
    subname: `${m.vendor} · ${m.id}`,
    color: m.id === modelId.value ? 'var(--brand)' : undefined,
    id: m.id,
  })),
);
function onSelectModel(action) {
  modelId.value = action.id;
}

// 简历上传解析
const fileInput = ref(null);
const uploading = ref(false);
const resumeName = ref('');
async function onFile(e) {
  const file = e.target.files?.[0];
  e.target.value = ''; // 允许重复选择同一文件
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    showToast('文件不能超过 5MB');
    return;
  }
  uploading.value = true;
  try {
    const fd = new FormData();
    fd.append('file', file);
    const res = await api.post('/resume/parse', fd);
    jdText.value = res.text;
    resumeName.value = res.filename;
    showToast({ type: 'success', message: `已解析简历（${res.length} 字）` });
  } catch (e) {
    /* 错误已统一提示 */
  } finally {
    uploading.value = false;
  }
}

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
      model: modelId.value,
    });
    router.replace(`/session/${res.id}`);
  } catch (e) {
    /* 错误已统一提示 */
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  try {
    const r = await api.get('/models');
    models.value = r.models || [];
    const rec = models.value.find((m) => m.recommended);
    modelId.value = rec ? rec.id : models.value[0]?.id || '';
  } catch (e) {
    /* 模型清单拉取失败时，后端会回退默认模型 */
  }
});
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
.new__model-label {
  font-size: 15px;
  font-weight: 600;
}
.new__model-tag {
  margin-left: 8px;
  transform: translateY(-1px);
}
.new__upload {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px 0;
  flex-wrap: wrap;
}
.new__file {
  font-size: 12px;
  color: #07c160;
}
.new__footer {
  padding: 28px 16px 24px;
}
</style>
