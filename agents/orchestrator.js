import { prospectFinderAgent } from './prospectFinder.js';
import { messageGeneratorAgent } from './messageGenerator.js';
import { followupAutomationAgent } from './followupAutomation.js';
import { query } from '../config/database.js';

export async function runAgentPipeline(userId, pipelineConfig) {
  const startTime = Date.now();
  const results = [];
  let totalTokens = 0;
  let totalCost = 0;

  console.log('🔄 Starting agent pipeline', { userId, agents: pipelineConfig.agents });

  try {
    for (const agentName of pipelineConfig.agents) {
      console.log(`▶️ Running ${agentName}...`);
      let result = null;

      if (agentName === 'prospect-finder') {
        result = await prospectFinderAgent(pipelineConfig.criteria || {});
      }

      else if (agentName === 'message-generator') {
        const prospect = (pipelineConfig.prospects && pipelineConfig.prospects[0]) || {
          id: 'demo', name: 'Prospect Demo', job_title: 'Directeur',
          company: 'Entreprise XYZ', city: pipelineConfig.criteria?.city || 'Paris'
        };
        result = await messageGeneratorAgent(prospect, pipelineConfig.userContext || {});
      }

      else if (agentName === 'followup-automation') {
        const prospect = (pipelineConfig.prospects && pipelineConfig.prospects[0]) || {
          id: 'demo', name: 'Prospect Demo', job_title: 'Directeur',
          company: 'Entreprise XYZ', city: pipelineConfig.criteria?.city || 'Paris'
        };
        result = await followupAutomationAgent(prospect, [], pipelineConfig.userContext || {});
      }

      if (result) {
        results.push(result);
        if (result.success && result.tokens) {
          totalTokens += result.tokens.used || 0;
          totalCost += result.tokens.cost || 0;
        }
      }
    }

    const executionTime = Date.now() - startTime;

    if (totalTokens > 0) {
      try {
        await query(`UPDATE users SET tokens_remaining = GREATEST(0, tokens_remaining - $1) WHERE id = $2`, [totalTokens, userId]);
        await query(`INSERT INTO api_logs (user_id, agent_type, tokens_used, status) VALUES ($1, 'pipeline', $2, 'SUCCESS')`, [userId, totalTokens]);
      } catch (err) {
        console.error('DB update error:', err.message);
      }
    }

    console.log('✅ Pipeline done', { tokensUsed: totalTokens, executionTime: `${executionTime}ms` });

    return {
      success: true,
      pipeline: pipelineConfig.stage,
      results,
      summary: { totalTokens, totalCost, executionTime, agentsCompleted: results.filter(r => r?.success).length }
    };

  } catch (error) {
    console.error('❌ Pipeline error:', error.message);
    return { success: false, error: error.message, results };
  }
}
