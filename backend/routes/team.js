const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// List team + admin members (for assignee dropdowns and team page)
router.get('/', requireAuth, requireRole('admin', 'team'), async (req, res) => {
  try {
    const members = await User.find({ role: { $in: ['admin', 'team'] } }).sort({ createdAt: 1 });
    res.json(members);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List client-role users (for linking to a client company)
router.get('/clients-users', requireAuth, requireRole('admin', 'team'), async (req, res) => {
  try {
    const users = await User.find({ role: 'client' }).populate('clientId', 'name');
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password, role, title, clientId } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required' });
    const normalized = email.toLowerCase().trim();
    const exists = await User.findOne({ email: normalized });
    if (exists) return res.status(409).json({ error: 'Email already in use' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: normalized,
      passwordHash,
      role: role || 'team',
      title: title || '',
      clientId: clientId || null,
    });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.password) {
      update.passwordHash = await bcrypt.hash(update.password, 10);
      delete update.password;
    }
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
