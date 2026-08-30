const express = require('express');
const Invoice = require('../models/Invoice');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

function computeTotals(items, taxRate = 0) {
  const subtotal = (items || []).reduce(
    (s, i) => s + (Number(i.quantity) || 0) * (Number(i.rate) || 0),
    0
  );
  const total = subtotal + (subtotal * (Number(taxRate) || 0)) / 100;
  return { subtotal, total };
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'client') filter.clientId = req.user.clientId;
    const invoices = await Invoice.find(filter)
      .populate('clientId', 'name company')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', requireAuth, requireRole('admin', 'team'), async (req, res) => {
  try {
    const count = await Invoice.countDocuments();
    const number = req.body.number || `INV-${String(count + 1).padStart(4, '0')}`;
    const { subtotal, total } = computeTotals(req.body.items, req.body.taxRate);
    const invoice = await Invoice.create({
      ...req.body,
      number,
      subtotal,
      total,
      createdBy: req.user._id,
    });
    const populated = await Invoice.findById(invoice._id)
      .populate('clientId', 'name company')
      .populate('projectId', 'name');
    res.json(populated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', requireAuth, requireRole('admin', 'team'), async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.items) {
      const { subtotal, total } = computeTotals(update.items, update.taxRate);
      update.subtotal = subtotal;
      update.total = total;
    }
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('clientId', 'name company')
      .populate('projectId', 'name');
    res.json(invoice);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Client can mark their own invoice as paid (tracking only)
router.put('/:id/status', requireAuth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (req.user.role === 'client' && String(invoice.clientId) !== String(req.user.clientId))
      return res.status(403).json({ error: 'Forbidden' });
    invoice.status = req.body.status;
    await invoice.save();
    res.json(invoice);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
