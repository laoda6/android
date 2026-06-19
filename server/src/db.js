/**
 * 数据库模块
 * ------------------------------------------------------------------
 * 基于 Node.js 24 内置的 node:sqlite，无需任何原生编译依赖。
 * 负责：建立连接、初始化表结构，并对外暴露 db 实例供各路由使用。
 */
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 数据库文件统一存放于 server/data 目录，确保目录存在
const dataDir = join(__dirname, '..', 'data');
mkdirSync(dataDir, { recursive: true });
const dbPath = join(dataDir, 'app.db');

/** 全局唯一的数据库连接实例 */
export const db = new DatabaseSync(dbPath);

// 开启外键约束（SQLite 默认关闭）
db.exec('PRAGMA foreign_keys = ON;');

// 初始化表结构：IF NOT EXISTS 保证服务可重复启动而不报错
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    UNIQUE NOT NULL,            -- 用户名（唯一）
  password_hash TEXT    NOT NULL,                   -- bcrypt 加密后的密码
  created_at    TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS interviews (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL,                 -- 所属用户
  position        TEXT    NOT NULL,                 -- 面试岗位方向
  difficulty      TEXT    NOT NULL,                 -- 难度：初级/中级/高级
  total_rounds    INTEGER NOT NULL,                 -- 计划面试轮数（题数）
  jd_text         TEXT,                             -- 可选：岗位 JD 或简历文本
  model           TEXT,                             -- 本场面试使用的大模型 id
  status          TEXT    NOT NULL DEFAULT 'ongoing', -- ongoing / finished
  current_round   INTEGER NOT NULL DEFAULT 0,       -- 当前已进行到第几轮
  total_score     INTEGER,                          -- 总分（评估后写入）
  evaluation_json TEXT,                             -- 多维评估结果（JSON 字符串）
  created_at      TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
  finished_at     TEXT,                             -- 结束评估时间
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  interview_id INTEGER NOT NULL,                    -- 所属面试
  role         TEXT    NOT NULL,                    -- interviewer（面试官）/ candidate（候选人）
  content      TEXT    NOT NULL,                    -- 消息内容
  round_no     INTEGER,                             -- 所属轮次
  created_at   TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE
);
`);

// 兼容旧数据库：若 interviews 表缺少 model 列则补充（幂等）
const interviewCols = db.prepare('PRAGMA table_info(interviews)').all();
if (!interviewCols.some((c) => c.name === 'model')) {
  db.exec('ALTER TABLE interviews ADD COLUMN model TEXT');
}

console.log('📦 数据库已就绪:', dbPath);
