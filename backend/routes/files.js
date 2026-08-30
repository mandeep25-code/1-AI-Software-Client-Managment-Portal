const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const FileRec = require('../models/FileRec');
const Project = require('../models/Project');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { putObject, getObject } = require('../config/storage');

const router = express.Router();
const APP_NAME = 'ai-portal';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

async function canAccess(user, projectId) {
  if (user.role === 'admin' || user.role === 'team') return true;
  const project = await Project.findById(projectId);
  return project && String(project.clientId) === String(user.clientId);
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ error: 'projectId is required' });
    if (!(await canAccess(req.user, projectId)))
      return res.status(403).json({ error: 'Forbidden' });
    const files = await FileRec.find({ projectId, isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    res.json(files);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const { projectId } = req.body;
    if (!projectId || !req.file) return res.status(400).json({ error: 'projectId and file required' });
    if (!(await canAccess(req.user, projectId)))
      return res.status(403).json({ error: 'Forbidden' });
    const ext = req.file.originalname.includes('.')
      ? req.file.originalname.split('.').pop()
      : 'bin';
    const path = `${APP_NAME}/uploads/${projectId}/${crypto.randomUUID()}.${ext}`;
    const result = await putObject(
      path,
      req.file.buffer,
      req.file.mimetype || 'application/octet-stream'
    );
    const file = await FileRec.create({
      projectId,
      name: req.file.originalname,
      originalName: req.file.originalname,
      storagePath: result.path || path,
      size: result.size || req.file.size,
      mime: req.file.mimetype,
      uploadedBy: req.user._id,
      uploaderName: req.user.name,
    });
    res.json(file);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Download via backend (supports ?auth= for direct links)
router.get('/:id/download', async (req, res) => {
  try {
    const token = req.query.auth || (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: 'User not found' });
    const file = await FileRec.findById(req.params.id);
    if (!file || file.isDeleted) return res.status(404).json({ error: 'File not found' });
    if (!(await canAccess(user, file.projectId)))
      return res.status(403).json({ error: 'Forbidden' });
    const { buffer, contentType } = await getObject(file.storagePath);
    res.setHeader('Content-Type', file.mime || contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.send(buffer);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.role === 'client') return res.status(403).json({ error: 'Forbidden' });
    await FileRec.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
