import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import logger from './utils/logger.js';
import { initializeDatabase } from './config/database.js';

// Routes imports
import authRoutes from './routes/auth.js';
import agentRoutes from './routes/agents.js';
import prospectRoutes from './routes/prospects.js';
import tokenRoutes from './routes/tokens.js';
import connectorRoutes from './routes/connectors.js';
import webhookRoutes from './routes/webhooks.js';
import chatRoutes from './routes/chat.js';
import analyticsRoutes from './routes/analytics.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARE
// ==========================================

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow all origins for now (can restrict later)
    callback(null, true);
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// ==========================================
// ROUTES
// ==========================================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/agents', agentRoutes);
app.use('/prospects', prospectRoutes);
app.use('/tokens', tokenRoutes);
app.use('/connectors', connectorRoutes);
app.use('/webhook', webhookRoutes);
app.use('/chat', chatRoutes);
app.use('/analytics', analyticsRoutes);

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Global error handler:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    status: err.status || 500,
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// DATABASE INITIALIZATION
// ==========================================

async function startServer() {
  // Start server immediately (don't wait for DB)
  app.listen(PORT, () => {
    logger.info(`✅ PROZQEN API running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
  });

  // Connect to DB after server starts
  try {
    logger.info('Connecting to database...');
    await initializeDatabase();
    logger.info('✅ Database connected!');
  } catch (error) {
    logger.error('⚠️ Database connection failed:', error.message);
    // Non-fatal: API still works without DB
  }
}

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// ==========================================
// START
// ==========================================

startServer();

export default app;
