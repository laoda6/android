/**
 * 大模型调用模块（主用 + 备用 自动故障转移）
 * ------------------------------------------------------------------
 * 采用 OpenAI 兼容的 Chat Completions 协议，因此同一套代码可对接
 * 火山方舟、阿里云百炼、DeepSeek 等多家厂商，切换只需改 .env。
 *
 * 调用策略：优先请求"主用"厂商；若超时或报错，自动切换到"备用"厂商，
 * 从而在高峰期网络抖动时仍能稳定返回结果。
 */

/** 从环境变量读取已配置的厂商列表（主用在前、备用在后） */
function providers() {
  return [
    {
      name: process.env.LLM_PRIMARY_NAME || '主用',
      baseUrl: process.env.LLM_PRIMARY_BASE_URL,
      apiKey: process.env.LLM_PRIMARY_API_KEY,
      model: process.env.LLM_PRIMARY_MODEL,
    },
    {
      name: process.env.LLM_FALLBACK_NAME || '备用',
      baseUrl: process.env.LLM_FALLBACK_BASE_URL,
      apiKey: process.env.LLM_FALLBACK_API_KEY,
      model: process.env.LLM_FALLBACK_MODEL,
    },
  ].filter((p) => p.baseUrl && p.apiKey && p.model); // 过滤掉未配置的厂商
}

/** 向单个厂商发起一次请求，带超时控制；失败/空响应均抛出异常 */
async function callOnce(provider, messages, temperature, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: provider.model, messages, temperature }),
      signal: controller.signal,
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`HTTP ${resp.status}: ${text.slice(0, 200)}`);
    }
    const data = await resp.json();
    const content = (data.choices?.[0]?.message?.content || '').trim();
    if (!content) throw new Error('模型返回内容为空');
    return content;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 底层对话补全：依次尝试主用→备用，任一成功即返回。
 * @param {Array<{role:string,content:string}>} messages OpenAI 格式消息列表
 * @param {{temperature?:number, model?:string}} options 采样温度；model 用于覆盖主用厂商的模型
 */
async function chat(messages, { temperature = 0.7, model } = {}) {
  const timeoutMs = parseInt(process.env.LLM_TIMEOUT_MS || '40000', 10);
  // 若调用方指定了 model，则覆盖主用厂商（火山方舟）的模型；备用厂商保持各自配置
  const list = providers().map((p, i) => (i === 0 && model ? { ...p, model } : p));
  if (list.length === 0) throw new Error('未配置任何大模型厂商，请检查 .env');

  let lastError;
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    try {
      const out = await callOnce(p, messages, temperature, timeoutMs);
      if (i > 0) console.warn(`⚠️  已切换到备用厂商 [${p.name}/${p.model}] 并成功返回`);
      return out;
    } catch (e) {
      lastError = e;
      console.warn(`⚠️  厂商 [${p.name}/${p.model}] 调用失败：${e.message}${i < list.length - 1 ? '，尝试下一个…' : ''}`);
    }
  }
  throw new Error(`所有大模型厂商均调用失败：${lastError?.message || '未知错误'}`);
}

/** 构造"面试官"人设的系统提示词 */
function interviewerSystemPrompt(position, difficulty, jdText) {
  let prompt = `你是一位资深的「${position}」岗位面试官，本场面试难度定位为「${difficulty}」。
请严格遵守以下规则：
1. 每次只提出一个问题，问题要专业、有针对性、且口语化，贴近真实面试场景；
2. 结合候选人上一轮的回答进行合理追问，或自然过渡到新的考察点，循序渐进；
3. 你只负责提问，不要给出参考答案，也不要点评候选人的回答；
4. 直接输出问题本身，不要添加"问题："之类的前缀，不要使用 Markdown 语法。`;
  if (jdText && jdText.trim()) {
    prompt += `\n\n以下是本次面试参考的岗位 JD 或候选人简历，请据此设计更贴合的问题：\n"""\n${jdText.trim()}\n"""`;
  }
  return prompt;
}

/**
 * 生成下一轮面试问题
 * @param {string} position 岗位
 * @param {string} difficulty 难度
 * @param {string} jdText 可选 JD/简历
 * @param {Array<{role:string,content:string}>} history 历史对话（role 为 interviewer/candidate）
 * @returns {Promise<string>} 面试官的下一个问题
 */
export async function generateQuestion(position, difficulty, jdText, history, model) {
  const messages = [
    { role: 'system', content: interviewerSystemPrompt(position, difficulty, jdText) },
  ];
  // 将内部角色映射为 OpenAI 角色：面试官->assistant，候选人->user
  for (const m of history) {
    messages.push({
      role: m.role === 'interviewer' ? 'assistant' : 'user',
      content: m.content,
    });
  }
  // 还没有任何对话时，用一句引导让模型抛出第一个问题
  if (history.length === 0) {
    messages.push({ role: 'user', content: '请开始面试，提出第一个问题。' });
  }
  return chat(messages, { temperature: 0.8, model });
}

/**
 * 面试结束后，对候选人整体表现做多维度评估，返回结构化对象
 * @returns {Promise<object>} 含 dimensions / totalScore / strengths / improvements / perQuestion / summary
 */
export async function evaluateInterview(position, difficulty, history, model) {
  // 将对话历史整理为可读的文本记录
  const transcript = history
    .map((m) => `${m.role === 'interviewer' ? '【面试官】' : '【候选人】'} ${m.content}`)
    .join('\n');

  const system = `你是一位严谨客观的「${position}」面试评估专家。请依据完整的面试问答记录，对候选人进行专业评估。
你必须严格输出如下结构的 JSON（只输出 JSON 本身，不要任何多余文字，不要使用 Markdown 代码块）：
{
  "dimensions": [
    {"name": "专业知识", "score": <0-100整数>, "comment": "<简短点评>"},
    {"name": "逻辑表达", "score": <0-100整数>, "comment": "<简短点评>"},
    {"name": "问题深度", "score": <0-100整数>, "comment": "<简短点评>"},
    {"name": "沟通能力", "score": <0-100整数>, "comment": "<简短点评>"},
    {"name": "综合潜力", "score": <0-100整数>, "comment": "<简短点评>"}
  ],
  "totalScore": <0-100整数，综合总分>,
  "strengths": ["<亮点1>", "<亮点2>"],
  "improvements": ["<改进建议1>", "<改进建议2>"],
  "perQuestion": [
    {"round": <轮次整数>, "comment": "<对该轮回答的点评>", "score": <0-100整数>}
  ],
  "summary": "<150字以内的总体评价>"
}`;
  const user = `面试岗位：${position}；难度：${difficulty}。\n以下是完整的面试记录：\n${transcript}`;

  const raw = await chat(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    { temperature: 0.3, model },
  );
  return normalizeEvaluation(parseJsonLoose(raw));
}

/**
 * 归一化评估结果：保证分数为 0~100 的整数、各字段结构完整，
 * 避免模型偶尔把分数写成文字等异常情况导致前端图表渲染出错。
 */
function normalizeEvaluation(ev) {
  const clamp = (v) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : null;
  };
  const dimensions = (Array.isArray(ev.dimensions) ? ev.dimensions : []).map((d) => ({
    name: String(d?.name ?? '维度'),
    score: clamp(d?.score) ?? 60, // 分数异常时给一个中性默认值
    comment: String(d?.comment ?? ''),
  }));
  const perQuestion = (Array.isArray(ev.perQuestion) ? ev.perQuestion : []).map((q, i) => ({
    round: Number(q?.round) || i + 1,
    comment: String(q?.comment ?? ''),
    score: clamp(q?.score) ?? 60,
  }));
  // 总分：优先用模型给的；缺失则取各维度平均分
  let totalScore = clamp(ev.totalScore);
  if (totalScore === null) {
    totalScore = dimensions.length
      ? Math.round(dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length)
      : 60;
  }
  return {
    dimensions,
    totalScore,
    strengths: (Array.isArray(ev.strengths) ? ev.strengths : []).map(String),
    improvements: (Array.isArray(ev.improvements) ? ev.improvements : []).map(String),
    perQuestion,
    summary: String(ev.summary ?? ''),
  };
}

/** 容错地从模型输出中解析 JSON 对象（兼容偶尔出现的多余文字/代码块） */
function parseJsonLoose(text) {
  // 去掉可能存在的 Markdown ```json 代码块包裹
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error('无法将评估结果解析为 JSON：' + cleaned.slice(0, 120));
  }
}
