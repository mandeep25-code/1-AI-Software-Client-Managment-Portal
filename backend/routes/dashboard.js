const express = require('express');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Client = require('../models/Client');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', requireAuth, async (req, res) => {
  try {
    const role = req.user.role;
    let projectFilter = {};
    if (role === 'client') projectFilter = { clientId: req.user.clientId };
    else if (role === 'team') projectFilter = { team: req.user._id };

    const projects = await Project.find(projectFilter).select('_id status progress');
    const projectIds = projects.map((p) => p._id);

    const tasks = await Task.find({ projectId: { $in: projectIds } }).select('status priority');
    const tasksByStatus = { todo: 0, in_progress: 0, done: 0 };
    tasks.forEach((t) => {
      tasksByStatus[t.status] = (tasksByStatus[t.status] || 0) + 1;
    });

    const projectsByStatus = { planning: 0, active: 0, on_hold: 0, completed: 0 };
    projects.forEach((p) => {
      projectsByStatus[p.status] = (projectsByStatus[p.status] || 0) + 1;
    });

    let invoiceFilter = {};
    if (role === 'client') invoiceFilter = { clientId: req.user.clientId };
    const invoices = await Invoice.find(invoiceFilter).select('total status');
    const revenue = {
      paid: invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0),
      outstanding: invoices
        .filter((i) => i.status === 'sent')
        .reduce((s, i) => s + i.total, 0),
    };

    const clientsCount = role === 'client' ? 1 : await Client.countDocuments();
    const teamCount = role === 'client' ? 0 : await User.countDocuments({ role: { $in: ['team', 'admin'] } });

    const avgProgress = projects.length
      ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length)
      : 0;

    res.json({
      totalProjects: projects.length,
      activeProjects: projectsByStatus.active,
      projectsByStatus,
      tasksByStatus,
      totalTasks: tasks.length,
      clientsCount,
      teamCount,
      revenue,
      avgProgress,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
