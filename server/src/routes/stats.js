/**
 * 统计路由：为"我的"页面提供成长数据（面试场次、平均分、最高分、成长曲线）
 */
import { Router } from 'express';
import { db } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

router.get('/', (req, res) => {
  const uid = req.user.id;

  const total = db.prepare('SELECT COUNT(*) AS n FROM interviews WHERE user_id = ?').get(uid).n;
  const finished = db
    .prepare("SELECT COUNT(*) AS n FROM interviews WHERE user_id = ? AND status = 'finished'")
    .get(uid).n;
  const avg = db
    .prepare('SELECT AVG(total_score) AS a FROM interviews WHERE user_id = ? AND total_score IS NOT NULL')
    .get(uid).a;
  const best = db
    .prepare('SELECT MAX(total_score) AS m FROM interviews WHERE user_id = ?')
    .get(uid).m;

  // 成长曲线：已完成评估的面试，按时间正序排列的分数序列
  const curve = db
    .prepare(
      `SELECT id, position, total_score AS score, finished_at
       FROM interviews WHERE user_id = ? AND total_score IS NOT NULL ORDER BY id`,
    )
    .all(uid);

  res.json({
    totalInterviews: total,
    finishedInterviews: finished,
    avgScore: avg ? Math.round(avg) : 0,
    bestScore: best || 0,
    curve,
  });
});

export default router;
