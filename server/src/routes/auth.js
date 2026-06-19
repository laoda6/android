/**
 * 用户认证路由：注册、登录、获取当前用户
 */
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { sign, authRequired } from '../middleware/auth.js';

const router = Router();

/** 注册：用户名唯一，密码经 bcrypt 加密后入库 */
router.post('/register', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });
  if (username.length < 2 || password.length < 4)
    return res.status(400).json({ error: '用户名至少 2 位，密码至少 4 位' });

  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) return res.status(409).json({ error: '该用户名已被注册' });

  const passwordHash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
    .run(username, passwordHash);

  const user = { id: Number(info.lastInsertRowid), username };
  res.json({ token: sign(user), user });
});

/** 登录：校验用户名与密码 */
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!row || !bcrypt.compareSync(password || '', row.password_hash))
    return res.status(401).json({ error: '用户名或密码错误' });

  const user = { id: row.id, username: row.username };
  res.json({ token: sign(user), user });
});

/** 获取当前登录用户信息（需登录） */
router.get('/me', authRequired, (req, res) => {
  res.json({ user: { id: req.user.id, username: req.user.username } });
});

export default router;
