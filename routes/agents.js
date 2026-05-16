import express from 'express';

import { authenticateToken } from './auth.js';
import { runAgentPipeline } from '../agents/orchestrator.js';
import { query } from '../config/database.js';

const router = express.Router();

// ==========================================
// POST /agents/run-pipeline
// Execute agents in sequence
// ==========================================

router.post('/run-pipeline', authenticateToken, async (req, res) => {
  try {
    const { agents, prospects, criteria, userContext, stage = 'full' } = req.body;

    // Get user info
    const userResult = await query(
      'SELECT * FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Check tokens
    const estimatedTokens = estimateTokens(agents);
    if (user.tokens_remaining < estimatedTokens) {
      return res.status(400).json({
        error: 'Insufficient tokens',
        required: estimatedTokens,
        available: user.tokens_remaining
      });
    }

    // Validate agents based on plan
    const validAgents = validateAgentsPlan(agents, user.plan);
    if (!validAgents) {
      return res.status(403).json({
        error: 'Some agents are not available in your plan',
        userPlan: user.plan
      });
    }

    // Run pipeline
    const pipelineConfig = {
      agents: agents,
      prospects: prospects || [],
      criteria: criteria || {},
      userContext: userContext || {},
      userPlan: user.plan,
      stage: stage
    };

    const result = await runAgentPipeline(req.user.userId, pipelineConfig);

    if (!result.success) {
      return res.status(500).json({
        error: 'Pipeline execution failed',
        details: result.error
      });
    }

    res.json({
      success: true,
      pipeline: result.pipeline,
      summary: result.summary,
      results: result.results
    });

  } catch (error) {
    console.error('Agent pipeline error:', error);
    res.status(500).json({ error: 'Pipeline execution failed' });
  }
});

// ==========================================
// GET /agents/history
// Get agent execution history
// ==========================================

router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const result = await query(
      `SELECT * FROM api_logs
       WHERE user_id = $1 AND agent_type LIKE 'agent-%'
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.userId, parseInt(limit), parseInt(offset)]
    );

    res.json({
      success: true,
      history: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

// ==========================================
// GET /agents/stats
// Get agent usage statistics
// ==========================================

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT
        agent_type,
        COUNT(*) as total_runs,
        SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as successful,
        SUM(tokens_used) as total_tokens_used,
        ROUND(AVG(tokens_used::numeric), 2) as avg_tokens,
        ROUND(100.0 * SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
       FROM api_logs
       WHERE user_id = $1
       GROUP BY agent_type
       ORDER BY total_runs DESC`,
      [req.user.userId]
    );

    res.json({
      success: true,
      stats: result.rows,
      totalAgentRuns: result.rows.reduce((sum, row) => sum + row.total_runs, 0)
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ==========================================
// HELPERS
// ==========================================

function estimateTokens(agents) {
  const tokenCosts = {
    'prospect-finder': 50,
    'message-generator': 30,
    'followup-automation': 20,
    'deal-analyzer': 25,
    'crm-sync': 15,
    'performance-optimizer': 40
  };

  let total = 0;
  for (const agent of agents) {
    total += tokenCosts[agent] || 0;
  }
  return total;
}

function validateAgentsPlan(agents, plan) {
  const proOnlyAgents = ['deal-analyzer', 'crm-sync', 'performance-optimizer'];

  if (plan === 'FREE') {
    // FREE plan: no agents available
    return agents.length === 0;
  }

  if (plan === 'BASIC') {
    // BASIC: all except PRO-only agents
    return !agents.some(a => proOnlyAgents.includes(a));
  }

  if (plan === 'PRO') {
    // PRO: all agents available
    return true;
  }

  return false;
}

export default router;
