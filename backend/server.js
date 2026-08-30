require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const seed = require('./config/seed');

const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/', (req, res) => res.json({ message: 'AI Portal API running' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/team', require('./routes/team'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/files', require('./routes/files'));
app.use('/api/ai', require('./routes/ai'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 8001;

connectDB()
  .then(async () => {
    await seed();
    app.listen(PORT, '0.0.0.0', () => console.log(`API listening on ${PORT}`));
  })
  .catch((e) => {
    console.error('Startup failed:', e);
    process.exit(1);
  });
