/**
 * 面试相关路由
 * ------------------------------------------------------------------
 * 创建面试、逐轮问答、结束评估、历史查询、删除。
 * 全部接口都需要登录（统一挂载 authRequired）。
 */
import { Router } from 'express';
import { db } from '../db.js';
import { authRequired } from '../middleware/auth.js';
import { generateQuestion, evaluateInterview } from '../llm.js';
import { normalizeModel } from '../models.js';

const router = Router();
router.use(authRequired);

/** 读取某场面试的完整对话历史（按时间正序） */
function getHistory(interviewId) {
  return db
    .prepare('SELECT role, content, round_no FROM messages WHERE interview_id = ? ORDER BY id')
    .all(interviewId);
}

/** 取出属于当前用户的面试，不存在/越权时直接响应 404 并返回 null */
function getOwnedInterview(req, res) {
  const it = db.prepare('SELECT * FROM interviews WHERE id = ?').get(req.params.id);
  if (!it || it.user_id !== req.user.id) {
    res.status(404).json({ error: '面试不存在' });
    return null;
  }
  return it;
}

/** 创建面试，并调用大模型生成第一题 */
router.post('/', async (req, res) => {
  try {
    const { position, difficulty = '中级', totalRounds = 5, jdText = '' } = req.body || {};
    if (!position || !position.trim()) return res.status(400).json({ error: '请填写面试岗位' });
    // 轮数限定在 1~10 之间，防止滥用
    const rounds = Math.min(Math.max(parseInt(totalRounds, 10) || 5, 1), 10);
    // 校验所选模型（不在白名单则回退默认）
    const model = normalizeModel(req.body?.model);

    const info = db
      .prepare(
        'INSERT INTO interviews (user_id, position, difficulty, total_rounds, jd_text, model, current_round) VALUES (?, ?, ?, ?, ?, ?, 0)',
      )
      .run(req.user.id, position.trim(), difficulty, rounds, jdText, model);
    const id = Number(info.lastInsertRowid);

    // 调用大模型生成第一题
    const question = await generateQuestion(position.trim(), difficulty, jdText, [], model);
    db.prepare('INSERT INTO messages (interview_id, role, content, round_no) VALUES (?, ?, ?, 1)').run(
      id,
      'interviewer',
      question,
    );
    db.prepare('UPDATE interviews SET current_round = 1 WHERE id = ?').run(id);

    res.json({ id, question, roundNo: 1, totalRounds: rounds });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** 历史列表 */
router.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT id, position, difficulty, total_rounds, status, total_score, created_at, finished_at
       FROM interviews WHERE user_id = ? ORDER BY id DESC`,
    )
    .all(req.user.id);
  res.json({ interviews: rows });
});

/** 面试详情：含完整对话与评估结果 */
router.get('/:id', (req, res) => {
  const it = getOwnedInterview(req, res);
  if (!it) return;
  const messages = getHistory(it.id);
  let evaluation = null;
  if (it.evaluation_json) {
    try {
      evaluation = JSON.parse(it.evaluation_json);
    } catch {
      /* 忽略损坏的历史数据 */
    }
  }
  res.json({ interview: it, messages, evaluation });
});

/** 提交本轮回答 → 生成下一题，或标记为可评估 */
router.post('/:id/answer', async (req, res) => {
  try {
    const it = getOwnedInterview(req, res);
    if (!it) return;
    if (it.status === 'finished') return res.status(400).json({ error: '本场面试已结束' });

    const { content } = req.body || {};
    if (!content || !content.trim()) return res.status(400).json({ error: '回答内容不能为空' });

    // 保存候选人回答
    db.prepare('INSERT INTO messages (interview_id, role, content, round_no) VALUES (?, ?, ?, ?)').run(
      it.id,
      'candidate',
      content.trim(),
      it.current_round,
    );

    // 已经回答完最后一轮 → 进入评估环节
    if (it.current_round >= it.total_rounds) {
      return res.json({ finished: true });
    }

    // 否则生成下一题（沿用本场面试选定的模型）
    const history = getHistory(it.id);
    const question = await generateQuestion(it.position, it.difficulty, it.jd_text, history, it.model);
    const nextRound = it.current_round + 1;
    db.prepare('INSERT INTO messages (interview_id, role, content, round_no) VALUES (?, ?, ?, ?)').run(
      it.id,
      'interviewer',
      question,
      nextRound,
    );
    db.prepare('UPDATE interviews SET current_round = ? WHERE id = ?').run(nextRound, it.id);

    res.json({ finished: false, question, roundNo: nextRound });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** 结束面试并生成多维评估报告（幂等：已评估则直接返回） */
router.post('/:id/finish', async (req, res) => {
  try {
    const it = getOwnedInterview(req, res);
    if (!it) return;
    if (it.evaluation_json) {
      return res.json({ evaluation: JSON.parse(it.evaluation_json), totalScore: it.total_score });
    }

    const history = getHistory(it.id);
    const evaluation = await evaluateInterview(it.position, it.difficulty, history, it.model);
    const total = Math.round(Number(evaluation.totalScore) || 0);

    db.prepare(
      `UPDATE interviews
       SET status = 'finished', total_score = ?, evaluation_json = ?, finished_at = datetime('now','localtime')
       WHERE id = ?`,
    ).run(total, JSON.stringify(evaluation), it.id);

    res.json({ evaluation, totalScore: total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** 删除面试 */
router.delete('/:id', (req, res) => {
  const it = getOwnedInterview(req, res);
  if (!it) return;
  db.prepare('DELETE FROM interviews WHERE id = ?').run(it.id);
  res.json({ ok: true });
});

export default router;
