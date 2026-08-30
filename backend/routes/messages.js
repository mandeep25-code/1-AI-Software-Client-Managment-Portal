const express = require('express');
const Message = require('../models/Message');
const Project = require('../models/Project');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

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
    const messages = await Message.find({ projectId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { projectId, body } = req.body;
    if (!projectId || !body) return res.status(400).json({ error: 'projectId and body required' });
    if (!(await canAccess(req.user, projectId)))
      return res.status(403).json({ error: 'Forbidden' });
    const message = await Message.create({
      projectId,
      body,
      senderId: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
    });
    res.json(message);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
