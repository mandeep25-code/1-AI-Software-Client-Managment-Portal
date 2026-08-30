const express = require('express');
const Client = require('../models/Client');
const Project = require('../models/Project');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, requireRole('admin', 'team'), async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    const withCounts = await Promise.all(
      clients.map(async (c) => {
        const projectCount = await Project.countDocuments({ clientId: c._id });
        return { ...c.toObject(), projectCount };
      })
    );
    res.json(withCounts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', requireAuth, requireRole('admin', 'team'), async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    const projects = await Project.find({ clientId: client._id });
    const users = await User.find({ clientId: client._id }).select('name email');
    res.json({ client, projects, users });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', requireAuth, requireRole('admin', 'team'), async (req, res) => {
  try {
    const client = await Client.create({ ...req.body, createdBy: req.user._id });
    res.json(client);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', requireAuth, requireRole('admin', 'team'), async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(client);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await Client.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
