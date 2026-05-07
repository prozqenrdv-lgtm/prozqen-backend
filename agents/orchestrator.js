import logger from '../utils/logger.js';
import { prospectFinderAgent } from './prospectFinder.js';
import { messageGeneratorAgent } from './messageGenerator.js';
import { followupAutomationAgent } from './followupAutomation.js';
import { dealAnalyzerAgent } from './dealAnalyzer.js';
import { crmSyncAgent } from './crmSync.js';
import { performanceOptimizerAgent } from './performanceOptimizer.js';
import { query } from '../config/database.js';

/**
 * AGENT ORCHESTRATOR
 * Exécute les agents dans un pipeline cohérent
 * Gère les dépendances et les tokens
 */

export async function runAgentPipeline(userId, pipelineConfig) {
  const startTime = Date.now();
  const results = [];
  let totalTokens = 0;
  let totalCost = 0;

  try {
    logger.info('🔄 Starting agent pipeline', {
      userId,
      agents: pipelineConfig.agents,
      stage: pipelineConfig.stage
    });

    // ==========================================
    // STAGE 1: PROSPECT IDENTIFICATION
    // ==========================================

    if (pipelineConfig.agents.includes('prospect-finder')) {
      logger.info('▶️ Running Prospect Finder agent...');

      const prospectResult = await prospectFinderAgent(pipelineConfig.criteria);
      results.push(prospectResult);

      if (prospectResult.success) {
        totalTokens += prospectResult.tokens.used;
        totalCost += prospectResult.tokens.cost;
      }
    }

    // ==========================================
    // STAGE 2: MESSAGE GENERATION
    // ==========================================

    if (pipelineConfig.agents.includes('message-generator') && pipelineConfig.prospects) {
      logger.info('▶️ Running Message Generator agent...');

      for (const prospect of pipelineConfig.prospects) {
        const messageResult = await messageGeneratorAgent(prospect, pipelineConfig.userContext);
        results.push(messageResult);

        if (messageResult.success) {
          totalTokens += messageResult.tokens.used;
          totalCost += messageResult.tokens.cost;

          // Save generated messages to database
          await saveGeneratedMessages(prospect.id, messageResult.data);
        }
      }
    }

    // ==========================================
    // STAGE 3: FOLLOW-UP AUTOMATION
    // ==========================================

    if (pipelineConfig.agents.includes('followup-automation') && pipelineConfig.prospects) {
      logger.info('▶️ Running Follow-up Automation agent...');

      for (const prospect of pipelineConfig.prospects) {
        const communicationHistory = await getCommunicationHistory(prospect.id);

        const followupResult = await followupAutomationAgent(
          prospect,
          communicationHistory,
          pipelineConfig.userContext
        );
        results.push(followupResult);

        if (followupResult.success) {
          totalTokens += followupResult.tokens.used;
          totalCost += followupResult.tokens.cost;

          // Schedule follow-ups
          await scheduleFollowups(prospect.id, followupResult.data.relances);
        }
      }
    }

    // ==========================================
    // STAGE 4: DEAL ANALYSIS (PRO ONLY)
    // ==========================================

    if (
      pipelineConfig.agents.includes('deal-analyzer') &&
      pipelineConfig.prospects &&
      pipelineConfig.userPlan === 'PRO'
    ) {
      logger.info('▶️ Running Deal Analyzer agent...');

      const dealResult = await dealAnalyzerAgent(
        pipelineConfig.prospects,
        pipelineConfig.userContext
      );
      results.push(dealResult);

      if (dealResult.success) {
        totalTokens += dealResult.tokens.used;
        totalCost += dealResult.tokens.cost;

        // Update prospect scores
        await updateProspectScores(dealResult.data.analyzed_prospects);
      }
    }

    // ==========================================
    // STAGE 5: CRM SYNC (PRO ONLY)
    // ==========================================

    if (
      pipelineConfig.agents.includes('crm-sync') &&
      pipelineConfig.crmConfig &&
      pipelineConfig.userPlan === 'PRO'
    ) {
      logger.info('▶️ Running CRM Sync agent...');

      for (const prospect of pipelineConfig.prospects) {
        const crmResult = await crmSyncAgent(prospect, pipelineConfig.crmConfig);
        results.push(crmResult);

        if (crmResult.success) {
          totalTokens += crmResult.tokens.used;
          totalCost += crmResult.tokens.cost;

          // Save CRM sync result
          await saveCrmSync(prospect.id, crmResult.data);
        }
      }
    }

    // ==========================================
    // STAGE 6: PERFORMANCE OPTIMIZATION (PRO ONLY)
    // ==========================================

    if (
      pipelineConfig.agents.includes('performance-optimizer') &&
      pipelineConfig.userPlan === 'PRO'
    ) {
      logger.info('▶️ Running Performance Optimizer agent...');

      const performanceData = await getPerformanceData(userId);
      const conversions = await getConversions(userId);

      const optimResult = await performanceOptimizerAgent(
        performanceData,
        conversions
      );
      results.push(optimResult);

      if (optimResult.success) {
        totalTokens += optimResult.tokens.used;
        totalCost += optimResult.tokens.cost;

        // Save optimization recommendations
        await saveOptimizations(userId, optimResult.data);
      }
    }

    // ==========================================
    // FINALIZE PIPELINE
    // ==========================================

    const executionTime = Date.now() - startTime;

    // Update user tokens
    await updateUserTokens(userId, totalTokens);

    // Log pipeline execution
    await logPipelineExecution(userId, {
      agents: pipelineConfig.agents,
      tokensUsed: totalTokens,
      cost: totalCost,
      executionTime: executionTime,
      status: 'SUCCESS',
      resultCount: results.length
    });

    logger.info('✅ Agent pipeline completed', {
      userId,
      tokensUsed: totalTokens,
      cost: `$${totalCost.toFixed(6)}`,
      executionTime: `${executionTime}ms`,
      agentsRun: pipelineConfig.agents.length
    });

    return {
      success: true,
      pipeline: pipelineConfig.stage,
      results: results,
      summary: {
        totalTokens: totalTokens,
        totalCost: totalCost,
        executionTime: executionTime,
        agentsCompleted: results.filter(r => r.success).length,
        agentsFailed: results.filter(r => !r.success).length
      }
    };

  } catch (error) {
    logger.error('❌ Agent pipeline error:', error);

    // Log failure
    await logPipelineExecution(userId, {
      agents: pipelineConfig.agents,
      status: 'FAILED',
      error: error.message
    });

    return {
      success: false,
      pipeline: pipelineConfig.stage,
      error: error.message,
      results: results
    };
  }
}

// ==========================================
// DATABASE HELPERS
// ==========================================

async function saveGeneratedMessages(prospectId, messages) {
  try {
    await query(
      `UPDATE prospects SET generated_messages = $1, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(messages), prospectId]
    );
  } catch (error) {
    logger.error('Error saving generated messages:', error);
  }
}

async function getCommunicationHistory(prospectId) {
  try {
    const result = await query(
      `SELECT * FROM agent_runs WHERE prospect_id = $1 ORDER BY created_at DESC`,
      [prospectId]
    );
    return result.rows;
  } catch (error) {
    logger.error('Error getting communication history:', error);
    return [];
  }
}

async function scheduleFollowups(prospectId, relances) {
  try {
    // Implementation depends on your scheduling system
    logger.info('Follow-ups scheduled for prospect:', prospectId);
  } catch (error) {
    logger.error('Error scheduling follow-ups:', error);
  }
}

async function updateProspectScores(analyzedProspects) {
  try {
    for (const prospect of analyzedProspects) {
      await query(
        `UPDATE prospects SET score = $1, priority = $2, updated_at = NOW() WHERE id = $3`,
        [prospect.overall_score, prospect.priority, prospect.prospect_id]
      );
    }
  } catch (error) {
    logger.error('Error updating prospect scores:', error);
  }
}

async function saveCrmSync(prospectId, crmData) {
  try {
    await query(
      `UPDATE prospects SET crm_sync_data = $1, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(crmData), prospectId]
    );
  } catch (error) {
    logger.error('Error saving CRM sync:', error);
  }
}

async function getPerformanceData(userId) {
  try {
    const result = await query(
      `SELECT COUNT(*) as total_messages, SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as conversions FROM agent_runs WHERE user_id = $1`,
      [userId]
    );

    const data = result.rows[0];
    return {
      total_messages_sent: parseInt(data.total_messages),
      conversions: parseInt(data.conversions),
      conversion_rate: ((parseInt(data.conversions) / parseInt(data.total_messages)) * 100).toFixed(2)
    };
  } catch (error) {
    logger.error('Error getting performance data:', error);
    return { total_messages_sent: 0, conversions: 0, conversion_rate: 0 };
  }
}

async function getConversions(userId) {
  try {
    const result = await query(
      `SELECT * FROM agent_runs WHERE user_id = $1 AND status = 'SUCCESS' LIMIT 10`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    logger.error('Error getting conversions:', error);
    return [];
  }
}

async function saveOptimizations(userId, recommendations) {
  try {
    await query(
      `UPDATE users SET optimization_recommendations = $1, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(recommendations), userId]
    );
  } catch (error) {
    logger.error('Error saving optimizations:', error);
  }
}

async function updateUserTokens(userId, tokensUsed) {
  try {
    await query(
      `UPDATE users SET tokens_remaining = tokens_remaining - $1, updated_at = NOW() WHERE id = $2`,
      [tokensUsed, userId]
    );
  } catch (error) {
    logger.error('Error updating user tokens:', error);
  }
}

async function logPipelineExecution(userId, data) {
  try {
    await query(
      `INSERT INTO api_logs (user_id, agent_type, tokens_used, status, request_payload, response_payload)
       VALUES ($1, 'pipeline', $2, $3, $4, $5)`,
      [userId, data.tokensUsed || 0, data.status, JSON.stringify(data), JSON.stringify(data)]
    );
  } catch (error) {
    logger.error('Error logging pipeline execution:', error);
  }
}
