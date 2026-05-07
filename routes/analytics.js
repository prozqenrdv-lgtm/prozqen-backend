import express from 'express';
import logger from '../utils/logger.js';
import { authenticateToken } from './auth.js';
import { query } from '../config/database.js';

const router = express.Router();

/**
 * GET /analytics/dashboard
 * Get complete dashboard data
 */
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    // Get user info
    const userResult = await query(
      'SELECT plan, tokens_remaining, tokens_limit FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get prospect stats
    const prospectStats = await query(
      `SELECT status, COUNT(*) as count FROM prospects WHERE user_id = $1 GROUP BY status`,
      [req.user.userId]
    );

    // Get agent stats
    const agentStats = await query(
      `SELECT agent_type, COUNT(*) as executions, SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as successes
       FROM api_logs WHERE user_id = $1 GROUP BY agent_type`,
      [req.user.userId]
    );

    // Get token usage
    const tokenUsage = await query(
      `SELECT SUM(tokens_used) as total_used FROM api_logs WHERE user_id = $1`,
      [req.user.userId]
    );

    // Get conversion rate (last 30 days)
    const conversionData = await query(
      `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'CONVERTED' THEN 1 ELSE 0 END) as converted
       FROM prospects WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'`,
      [req.user.userId]
    );

    const conversion = conversionData.rows[0];
    const conversionRate = conversion.total > 0 
      ? ((conversion.converted / conversion.total) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      dashboard: {
        user: {
          plan: user.plan,
          tokensRemaining: user.tokens_remaining,
          tokensLimit: user.tokens_limit,
          percentageUsed: ((user.tokens_limit - user.tokens_remaining) / user.tokens_limit * 100).toFixed(1)
        },
        prospects: {
          byStatus: prospectStats.rows.reduce((acc, row) => {
            acc[row.status] = row.count;
            return acc;
          }, {}),
          total: prospectStats.rows.reduce((sum, row) => sum + row.count, 0)
        },
        agents: {
          byType: agentStats.rows,
          totalExecutions: agentStats.rows.reduce((sum, row) => sum + row.executions, 0),
          totalSuccessful: agentStats.rows.reduce((sum, row) => sum + (row.successes || 0), 0)
        },
        performance: {
          conversionRate: parseFloat(conversionRate),
          tokensCostThisMonth: (tokenUsage.rows[0].total_used || 0) * 0.000015 // Approximate cost
        }
      }
    });

  } catch (error) {
    logger.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

/**
 * GET /analytics/conversions
 * Get conversion data
 */
router.get('/conversions', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT DATE(created_at) as date, COUNT(*) as new_prospects, 
              SUM(CASE WHEN status = 'CLOSED' THEN 1 ELSE 0 END) as conversions
       FROM prospects
       WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [req.user.userId]
    );

    res.json({
      success: true,
      conversions: result.rows
    });

  } catch (error) {
    logger.error('Conversions error:', error);
    res.status(500).json({ error: 'Failed to get conversion data' });
  }
});

/**
 * GET /analytics/roi
 * Calculate ROI
 */
router.get('/roi', authenticateToken, async (req, res) => {
  try {
    // Get closed deals
    const dealsResult = await query(
      `SELECT COUNT(*) as count FROM prospects WHERE user_id = $1 AND status = 'CLOSED'`,
      [req.user.userId]
    );

    const closedDeals = dealsResult.rows[0].count || 0;

    // Get token cost
    const tokensResult = await query(
      `SELECT SUM(tokens_used) as total FROM api_logs WHERE user_id = $1`,
      [req.user.userId]
    );

    const tokensCost = (tokensResult.rows[0].total || 0) * 0.000015; // Approximate cost per token

    // Assume €50k average deal value
    const avgDealValue = 50000;
    const revenue = closedDeals * avgDealValue;
    const roi = tokensCost > 0 ? ((revenue - tokensCost) / tokensCost * 100).toFixed(2) : 0;

    res.json({
      success: true,
      roi: {
        closedDeals: closedDeals,
        estimatedRevenue: revenue,
        investedInTokens: tokensCost.toFixed(2),
        roiPercentage: parseFloat(roi),
        roiRatio: `1:${(revenue / tokensCost).toFixed(1)}`
      }
    });

  } catch (error) {
    logger.error('ROI calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate ROI' });
  }
});

export default router;
