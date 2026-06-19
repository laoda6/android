/**
 * 简历解析路由
 * ------------------------------------------------------------------
 * 接收上传的简历文件（PDF / Word .docx / TXT），在服务端提取纯文本后返回，
 * 供前端填入「JD/简历」字段，让 AI 据此个性化出题。
 */
import { Router } from 'express';
import multer from 'multer';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { authRequired } from '../middleware/auth.js';

// 文件存内存即可（解析完不落盘），限制 5MB
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

router.post('/parse', authRequired, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '未收到文件' });
    const name = req.file.originalname || '';
    const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
    const buf = req.file.buffer;

    let text = '';
    if (ext === '.pdf') {
      const parser = new PDFParse({ data: new Uint8Array(buf) });
      const data = await parser.getText();
      await parser.destroy?.();
      text = data.text || '';
    } else if (ext === '.docx') {
      const r = await mammoth.extractRawText({ buffer: buf });
      text = r.value || '';
    } else if (ext === '.txt') {
      text = buf.toString('utf-8');
    } else if (ext === '.doc') {
      return res.status(400).json({ error: '暂不支持旧版 .doc，请另存为 .docx 或 PDF 后再上传' });
    } else {
      return res.status(400).json({ error: '仅支持 PDF / Word(.docx) / TXT 文件' });
    }

    // 规整空白并限制长度，避免过长拖慢出题
    text = text.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
    if (!text) return res.status(422).json({ error: '未能从文件中提取到文字，请确认文件内容' });
    if (text.length > 4000) text = text.slice(0, 4000);

    res.json({ text, filename: name, length: text.length });
  } catch (e) {
    res.status(500).json({ error: '简历解析失败：' + e.message });
  }
});

export default router;
