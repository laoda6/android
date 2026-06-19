/**
 * 可选大模型清单
 * ------------------------------------------------------------------
 * 均为火山方舟 Coding Plan 提供、OpenAI 兼容的模型。
 * 本文件同时作为「后端白名单」与「前端下拉数据源」的单一事实来源
 * （前端通过 GET /api/models 拉取）。顺序大致按实测响应速度排列。
 */
export const MODELS = [
  { id: 'deepseek-v4-flash', label: 'DeepSeek (Flash)', vendor: '深度求索', recommended: true },
  { id: 'minimax-m2.7', label: 'MiniMax', vendor: 'MiniMax' },
  { id: 'doubao-seed-2.0-lite', label: '豆包 (Lite)', vendor: '字节跳动' },
  { id: 'kimi-k2.6', label: 'Kimi', vendor: '月之暗面' },
  { id: 'glm-5.2', label: 'GLM', vendor: '智谱AI' },
  { id: 'deepseek-v4-pro', label: 'DeepSeek (Pro)', vendor: '深度求索' },
  { id: 'doubao-seed-2.0-pro', label: '豆包 (Pro)', vendor: '字节跳动' },
];

export const DEFAULT_MODEL = 'deepseek-v4-flash';

const idSet = new Set(MODELS.map((m) => m.id));

/** 校验模型 id：在白名单内则原样返回，否则回退到默认模型 */
export function normalizeModel(model) {
  return idSet.has(model) ? model : DEFAULT_MODEL;
}
