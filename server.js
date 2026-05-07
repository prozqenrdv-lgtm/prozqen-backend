import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database.js';

import authRoutes from './routes/auth.js';
import agentRoutes from './routes/agents.js';
import prospectRoutes from './routes/prospects.js';
import tokenRoutes from './routes/tokens.js';
import connectorRoutes from './routes/connectors.js';
import webhookRoutes from './routes/webhooks.js';
import chatRoutes from './routes/chat.js';
import analyticsRoutes from './routes/analytics.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/agents', agentRoutes);
app.use('/prospects', prospectRoutes);
app.use('/tokens', tokenRoutes);
app.use('/connectors', connectorRoutes);
app.use('/webhook', webhookRoutes);
app.use('/chat', chatRoutes);
app.use('/analytics', analyticsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

async function start() {
  app.listen(PORT, () => {
    console.log(`✅ PROZQEN API running on port ${PORT}`);
  });
  try {
    await initializeDatabase();
    console.log('✅ Database connected!');
  } catch (err) {
    console.error('⚠️ Database error:', err.message);
  }
}

start();

export default app;
