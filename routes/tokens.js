import express from 'express';
import logger from '../utils/logger.js';
import { authenticateToken } from './auth.js';
import { query } from '../config/database.js';

const router = express.Router();

// ==========================================
// GET /tokens/balance
// Get current token balance
// ==========================================

router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, plan, tokens_remaining, tokens_limit, tokens_reset_date FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const percentageUsed = ((user.tokens_limit - user.tokens_remaining) / user.tokens_limit * 100).toFixed(1);

    res.json({
      success: true,
      balance: {
        remaining: user.tokens_remaining,
        limit: user.tokens_limit,
        used: user.tokens_limit - user.tokens_remaining,
        percentageUsed: parseFloat(percentageUsed),
        resetDate: user.tokens_reset_date,
        plan: user.plan
      }
    });

  } catch (error) {
    logger.error('Get token balance error:', error);
    res.status(500).json({ error: 'Failed to get token balance' });
  }
});

// ==========================================
// GET /tokens/history
// Get token usage history
// ==========================================

router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const result = await query(
      `SELECT agent_type, tokens_used, status, created_at FROM api_logs
       WHERE user_id = $1 AND tokens_used > 0
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.userId, parseInt(limit), parseInt(offset)]
    );

    // Calculate stats
    const statsResult = await query(
      `SELECT
        SUM(tokens_used) as total_tokens_used,
        COUNT(*) as total_operations,
        AVG(tokens_used::numeric) as avg_tokens_per_operation
       FROM api_logs
       WHERE user_id = $1`,
      [req.user.userId]
    );

    const stats = statsResult.rows[0] || {
      total_tokens_used: 0,
      total_operations: 0,
      avg_tokens_per_operation: 0
    };

    res.json({
      success: true,
      history: result.rows,
      stats: {
        totalTokensUsed: parseInt(stats.total_tokens_used) || 0,
        totalOperations: parseInt(stats.total_operations) || 0,
        avgTokensPerOperation: Math.round(stats.avg_tokens_per_operation) || 0
      }
    });

  } catch (error) {
    logger.error('Get token history error:', error);
    res.status(500).json({ error: 'Failed to get token history' });
  }
});

// ==========================================
// GET /tokens/usage-by-agent
// Get token usage breakdown by agent
// ==========================================

router.get('/usage-by-agent', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT
        agent_type,
        COUNT(*) as executions,
        SUM(tokens_used) as total_tokens,
        ROUND(AVG(tokens_used::numeric), 2) as avg_tokens,
        ROUND(100.0 * SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
       FROM api_logs
       WHERE user_id = $1 AND tokens_used > 0
       GROUP BY agent_type
       ORDER BY total_tokens DESC`,
      [req.user.userId]
    );

    res.json({
      success: true,
      breakdown: result.rows
    });

  } catch (error) {
    logger.error('Get usage by agent error:', error);
    res.status(500).json({ error: 'Failed to get usage breakdown' });
  }
});

// ==========================================
// POST /tokens/reset
// Admin: Reset user tokens (for testing)
// ==========================================

router.post('/reset', authenticateToken, async (req, res) => {
  try {
    // Only in development
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: 'This endpoint is development-only' });
    }

    const userResult = await query(
      'SELECT plan FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const plan = userResult.rows[0].plan;
    const limits = { FREE: 50, BASIC: 1000, PRO: 999999 };
    const limit = limits[plan] || 50;

    await query(
      `UPDATE users SET
       tokens_remaining = $1,
       tokens_reset_date = NOW() + INTERVAL '1 month'
       WHERE id = $2`,
      [limit, req.user.userId]
    );

    logger.info('✅ Tokens reset for development', { userId: req.user.userId, newLimit: limit });

    res.json({
      success: true,
      message: 'Tokens reset',
      newBalance: limit
    });

  } catch (error) {
    logger.error('Reset tokens error:', error);
    res.status(500).json({ error: 'Failed to reset tokens' });
  }
});

export default router;
