const express = require('express');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

async function scopedFilter(user, base = {}) {
  if (user.role === 'client') return { ...base, clientId: user.clientId };
  if (user.role === 'team') return { ...base, team: user._id };
  return base;
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const filter = await scopedFilter(req.user);
    const projects = await Project.find(filter)
      .populate('clientId', 'name company logo')
      .populate('team', 'name avatar title')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('clientId', 'name company logo email')
      .populate('team', 'name avatar title email');
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (req.user.role === 'client' && String(project.clientId?._id) !== String(req.user.clientId))
      return res.status(403).json({ error: 'Forbidden' });
    res.json(project);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', requireAuth, requireRole('admin', 'team'), async (req, res) => {
  try {
    const project = await Project.create({ ...req.body, createdBy: req.user._id });
    const populated = await Project.findById(project._id)
      .populate('clientId', 'name company logo')
      .populate('team', 'name avatar title');
    res.json(populated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', requireAuth, requireRole('admin', 'team'), async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('clientId', 'name company logo')
      .populate('team', 'name avatar title');
    res.json(project);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    await Task.deleteMany({ projectId: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
