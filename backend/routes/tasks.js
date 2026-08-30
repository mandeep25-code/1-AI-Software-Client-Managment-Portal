const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

async function canAccessProject(user, projectId) {
  if (user.role === 'admin') return true;
  const project = await Project.findById(projectId);
  if (!project) return false;
  if (user.role === 'client') return String(project.clientId) === String(user.clientId);
  return true;
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.query;
    const filter = {};
    if (projectId) {
      if (!(await canAccessProject(req.user, projectId)))
        return res.status(403).json({ error: 'Forbidden' });
      filter.projectId = projectId;
    } else if (req.user.role === 'client') {
      const projects = await Project.find({ clientId: req.user.clientId }).select('_id');
      filter.projectId = { $in: projects.map((p) => p._id) };
    } else if (req.user.role === 'team') {
      const projects = await Project.find({ team: req.user._id }).select('_id');
      filter.projectId = { $in: projects.map((p) => p._id) };
    }
    const tasks = await Task.find(filter)
      .populate('assigneeId', 'name avatar')
      .populate('projectId', 'name')
      .sort({ order: 1, createdAt: -1 });
    res.json(tasks);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', requireAuth, requireRole('admin', 'team'), async (req, res) => {
  try {
    const task = await Task.create(req.body);
    const populated = await Task.findById(task._id).populate('assigneeId', 'name avatar');
    res.json(populated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', requireAuth, requireRole('admin', 'team'), async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate(
      'assigneeId',
      'name avatar'
    );
    res.json(task);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', requireAuth, requireRole('admin', 'team'), async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
