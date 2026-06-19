/**
 * 鉴权中间件
 * ------------------------------------------------------------------
 * 使用 JWT（JSON Web Token）实现无状态登录态校验。
 */
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev_secret';

/** 根据用户信息签发 token，有效期 7 天 */
export function sign(user) {
  return jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '7d' });
}

/**
 * Express 中间件：要求请求头携带合法 token，
 * 校验通过后将用户信息挂载到 req.user，否则返回 401。
 */
export function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ error: '未登录或登录已失效' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}
