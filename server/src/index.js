/**
 * 后端服务入口
 * ------------------------------------------------------------------
 * AI 模拟面试官 - REST API 服务
 * 技术栈：Express + node:sqlite + JWT + 大模型(Qwen) API
 */
import 'dotenv/config'; // 必须最先加载环境变量
import express from 'express';
import cors from 'cors';
import './db.js'; // 初始化数据库（建表）
import authRoutes from './routes/auth.js';
import interviewRoutes from './routes/interviews.js';
import statsRoutes from './routes/stats.js';
import resumeRoutes from './routes/resume.js';
import { MODELS } from './models.js';

const app = express();
app.use(cors()); // 允许前端跨域访问（开发/演示环境）
app.use(express.json({ limit: '1mb' }));

// 健康检查
app.get('/api/health', (req, res) => res.json({ ok: true, name: 'AI 模拟面试官 API' }));
// 可选模型清单（供前端下拉）
app.get('/api/models', (req, res) => res.json({ models: MODELS }));

// 业务路由
app.use('/api/auth', authRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/resume', resumeRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ AI 模拟面试官后端已启动: http://localhost:${PORT}`);
});
