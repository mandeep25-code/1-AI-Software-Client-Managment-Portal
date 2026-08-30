const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Client = require('../models/Client');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Invoice = require('../models/Invoice');
const Message = require('../models/Message');

async function seed() {
  // 1. Admin (idempotent)
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: 'Mandeep (Admin)',
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: 'admin',
      title: 'Agency Owner',
    });
    console.log('Seeded admin:', adminEmail);
  } else if (!(await bcrypt.compare(adminPassword, admin.passwordHash))) {
    admin.passwordHash = await bcrypt.hash(adminPassword, 10);
    await admin.save();
  }

  // Only seed demo data once
  const existingProjects = await Project.countDocuments();
  if (existingProjects === 0) {
    // Team members
    const team1 = await User.create({
      name: 'Sarah Chen',
      email: 'sarah@agency.com',
      passwordHash: await bcrypt.hash('Team@123', 10),
      role: 'team',
      title: 'Lead Engineer',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=srgb&fm=jpg&w=200&q=80',
    });
    const team2 = await User.create({
      name: 'Marcus Reid',
      email: 'marcus@agency.com',
      passwordHash: await bcrypt.hash('Team@123', 10),
      role: 'team',
      title: 'Product Designer',
      avatar: 'https://images.unsplash.com/photo-1685760259914-ee8d2c92d2e0?crop=entropy&cs=srgb&fm=jpg&w=200&q=80',
    });

    // Clients (companies)
    const acme = await Client.create({
      name: 'Acme Corporation',
      contactName: 'John Carter',
      email: 'client@acme.com',
      phone: '+1 415 555 0132',
      company: 'Acme Corporation',
      logo: 'https://images.unsplash.com/photo-1761044590940-9e3205a60b92?crop=entropy&cs=srgb&fm=jpg&w=200&q=80',
      status: 'active',
      createdBy: admin._id,
    });
    const nova = await Client.create({
      name: 'Nova Labs',
      contactName: 'Elena Voss',
      email: 'hello@novalabs.io',
      phone: '+1 212 555 0199',
      company: 'Nova Labs',
      logo: 'https://images.unsplash.com/photo-1769985090420-087bc0a62ba3?crop=entropy&cs=srgb&fm=jpg&w=200&q=80',
      status: 'active',
      createdBy: admin._id,
    });

    // Client portal user linked to Acme
    await User.create({
      name: 'John Carter',
      email: 'client@acme.com',
      passwordHash: await bcrypt.hash('Client@123', 10),
      role: 'client',
      title: 'VP Product, Acme',
      clientId: acme._id,
    });

    // Projects
    const p1 = await Project.create({
      name: 'Acme Commerce Platform',
      description: 'A headless e-commerce platform with a custom checkout, inventory sync and analytics dashboard.',
      clientId: acme._id,
      team: [team1._id, team2._id],
      status: 'active',
      progress: 62,
      priority: 'high',
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      budget: 85000,
      createdBy: admin._id,
    });
    const p2 = await Project.create({
      name: 'Acme Mobile App',
      description: 'Cross-platform mobile companion app with push notifications and offline mode.',
      clientId: acme._id,
      team: [team2._id],
      status: 'planning',
      progress: 15,
      priority: 'medium',
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60),
      budget: 42000,
      createdBy: admin._id,
    });
    const p3 = await Project.create({
      name: 'Nova Labs Data Portal',
      description: 'Internal analytics portal with role-based dashboards and CSV export.',
      clientId: nova._id,
      team: [team1._id],
      status: 'active',
      progress: 40,
      priority: 'high',
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45),
      budget: 60000,
      createdBy: admin._id,
    });

    // Tasks
    const mkTask = (projectId, title, status, priority, assigneeId) =>
      Task.create({ projectId, title, status, priority, assigneeId });
    await mkTask(p1._id, 'Design checkout flow', 'done', 'high', team2._id);
    await mkTask(p1._id, 'Implement payment tracking', 'in_progress', 'high', team1._id);
    await mkTask(p1._id, 'Build inventory sync service', 'in_progress', 'medium', team1._id);
    await mkTask(p1._id, 'Set up analytics dashboard', 'todo', 'medium', team2._id);
    await mkTask(p1._id, 'QA & load testing', 'todo', 'low', team1._id);
    await mkTask(p2._id, 'Wireframes & prototype', 'in_progress', 'high', team2._id);
    await mkTask(p2._id, 'Push notification research', 'todo', 'medium', null);
    await mkTask(p3._id, 'Role-based access control', 'done', 'high', team1._id);
    await mkTask(p3._id, 'CSV export module', 'in_progress', 'medium', team1._id);
    await mkTask(p3._id, 'Dashboard charts', 'todo', 'medium', team1._id);

    // Invoices
    await Invoice.create({
      number: 'INV-0001',
      clientId: acme._id,
      projectId: p1._id,
      items: [
        { description: 'Discovery & design sprint', quantity: 1, rate: 12000 },
        { description: 'Frontend development (Aug)', quantity: 1, rate: 18000 },
      ],
      subtotal: 30000,
      taxRate: 0,
      total: 30000,
      status: 'paid',
      dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
      createdBy: admin._id,
    });
    await Invoice.create({
      number: 'INV-0002',
      clientId: acme._id,
      projectId: p1._id,
      items: [{ description: 'Backend development (Sep)', quantity: 1, rate: 22000 }],
      subtotal: 22000,
      taxRate: 0,
      total: 22000,
      status: 'sent',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15),
      createdBy: admin._id,
    });
    await Invoice.create({
      number: 'INV-0003',
      clientId: nova._id,
      projectId: p3._id,
      items: [{ description: 'Portal development milestone 1', quantity: 1, rate: 20000 }],
      subtotal: 20000,
      taxRate: 0,
      total: 20000,
      status: 'draft',
      createdBy: admin._id,
    });

    // Messages
    await Message.create({
      projectId: p1._id,
      senderId: team1._id,
      senderName: 'Sarah Chen',
      senderRole: 'team',
      body: 'Hi John — checkout flow is live on staging. Would love your feedback this week!',
    });
    await Message.create({
      projectId: p1._id,
      senderName: 'John Carter',
      senderRole: 'client',
      body: 'Looks great, Sarah. The team is reviewing today. One note on the payment step coming shortly.',
    });

    console.log('Seeded demo data (clients, projects, tasks, invoices, messages).');
  }

  // Write test credentials
  try {
    const creds = `# Test Credentials

## Admin (Agency Owner)
- Email: ${adminEmail}
- Password: ${adminPassword}
- Role: admin

## Team Member
- Email: sarah@agency.com
- Password: Team@123
- Role: team

- Email: marcus@agency.com
- Password: Team@123
- Role: team

## Client Portal
- Email: client@acme.com
- Password: Client@123
- Role: client (linked to Acme Corporation)

## Auth endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET  /api/auth/me  (Bearer token)

Auth: JWT Bearer token returned by login/register, sent as Authorization: Bearer <token>.
`;
    const dir = path.join('/app', 'memory');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'test_credentials.md'), creds);
  } catch (e) {
    console.log('Could not write test_credentials.md:', e.message);
  }
}

module.exports = seed;
