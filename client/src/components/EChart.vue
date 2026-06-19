<!-- ECharts 通用封装组件：负责初始化、按需重绘与自适应 -->
<template>
  <div ref="el" :style="{ width: '100%', height }"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
  option: { type: Object, required: true },
  height: { type: String, default: '260px' },
});

const el = ref(null);
let chart = null;

function render() {
  if (chart) chart.setOption(props.option, true);
}
function resize() {
  if (chart) chart.resize();
}

onMounted(() => {
  chart = echarts.init(el.value);
  render();
  window.addEventListener('resize', resize);
});

// option 变化时重绘
watch(() => props.option, render, { deep: true });

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize);
  if (chart) chart.dispose();
});
</script>
