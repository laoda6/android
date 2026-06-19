<!-- 面试列表项：用于首页"最近面试"与"面试记录"页 -->
<template>
  <div class="ii card" @click="$emit('click')">
    <div class="ii__main">
      <p class="ii__title">{{ item.position }}</p>
      <div class="ii__meta">
        <van-tag plain type="primary">{{ item.difficulty }}</van-tag>
        <span class="muted">{{ item.total_rounds }} 轮</span>
        <span class="muted">{{ formatDate(item.created_at) }}</span>
      </div>
    </div>
    <div class="ii__right">
      <template v-if="item.status === 'finished'">
        <div class="ii__score" :style="{ color: scoreColor(item.total_score) }">{{ item.total_score }}</div>
        <div class="ii__score-cap muted">得分</div>
      </template>
      <van-tag v-else type="warning" plain>进行中</van-tag>
    </div>
  </div>
</template>

<script setup>
defineProps({ item: { type: Object, required: true } });
defineEmits(['click']);

/** 截取 "MM-DD HH:mm" 显示 */
function formatDate(s) {
  return (s || '').slice(5, 16);
}
/** 按分数返回不同颜色 */
function scoreColor(v) {
  if (v >= 80) return '#07c160';
  if (v >= 60) return '#ff976a';
  return '#ee0a24';
}
</script>

<style scoped>
.ii {
  display: flex;
  align-items: center;
  padding: 14px 14px;
  margin: 10px 14px;
}
.ii__main {
  flex: 1;
  min-width: 0;
}
.ii__title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ii__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}
.ii__right {
  text-align: center;
  margin-left: 12px;
  min-width: 44px;
}
.ii__score {
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
}
.ii__score-cap {
  font-size: 11px;
  margin-top: 2px;
}
</style>
