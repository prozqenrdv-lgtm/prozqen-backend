import { callClaude, calculateTokenCost } from '../config/anthropic.js';


/**
 * AGENT #4: DEAL ANALYZER (PRO ONLY)
 * Analyse les opportunités et les score selon le potentiel
 * 
 * Input: Liste de prospects
 * Output: Scoring 0-100, priorité, et insights
 * Tokens: ~25 tokens par prospect analysé
 */

export async function dealAnalyzerAgent(prospects, userContext) {
  try {
    console.log('📊 Deal Analyzer agent started', {
      prospectCount: prospects.length
    });

    const prompt = `Tu es un expert en analyse d'opportunités immobilières. Score les prospects selon leur potentiel de conversion.

MES OBJECTIFS:
${JSON.stringify(userContext.goals, null, 2)}

MON TICKET MOYEN:
${userContext.average_deal_value || '50 000€'}

PROSPECTS À ANALYSER:
${JSON.stringify(prospects.slice(0, 20), null, 2)}

Pour chaque prospect, score de 0-100 basé sur:
- Fit avec mon profil client idéal (30%)
- Budget apparent (20%)
- Urgence/Timeline (20%)
- Accessibilité/Contact (15%)
- Histoire/Contexte (15%)

RÉPONDS UNIQUEMENT EN JSON:
{
  "analyzed_prospects": [
    {
      "prospect_id": "id",
      "name": "nom",
      "overall_score": 85,
      "breakdown": {
        "ideal_fit": 90,
        "budget": 75,
        "urgency": 80,
        "accessibility": 90,
        "context": 85
      },
      "priority": "high|medium|low",
      "deal_potential": "$XXX",
      "key_insights": ["insight 1", "insight 2"],
      "recommendation": "ce qu'il faut faire",
      "risk_factors": ["risque 1"],
      "win_probability": "70-80%"
    }
  ],
  "top_3_priorities": ["prospect 1", "prospect 2", "prospect 3"],
  "average_score": 75,
  "estimated_total_value": "$XXX",
  "next_actions": ["action 1", "action 2"]
}`;

    const response = await callClaude([
      {
        role: 'user',
        content: prompt
      }
    ], {
      temperature: 0.6  // Lower temperature for analytical tasks
    });

    // Parse JSON response
    let result;
    try {
      result = JSON.parse(response.content);
    } catch (error) {
      console.warn('Failed to parse Claude response');
      result = {
        raw_response: response.content,
        error: 'Could not parse JSON'
      };
    }

    // Calculate cost
    const cost = calculateTokenCost(response.tokens.input, response.tokens.output);

    console.log('✅ Deal Analyzer agent completed', {
      prospectCount: prospects.length,
      tokensUsed: response.tokens.total,
      cost: `$${cost.toFixed(6)}`
    });

    return {
      success: true,
      agent: 'deal-analyzer',
      data: result,
      tokens: {
        used: response.tokens.total,
        cost: cost
      }
    };

  } catch (error) {
    console.error('❌ Deal Analyzer agent error:', error);
    return {
      success: false,
      agent: 'deal-analyzer',
      error: error.message
    };
  }
}

/**
 * Helper: Filter prospects by score
 */
export function filterByScore(analyzedProspects, minScore = 70) {
  return analyzedProspects.filter(p => p.overall_score >= minScore);
}

/**
 * Helper: Sort by priority
 */
export function sortByPriority(analyzedProspects) {
  const priorityMap = { high: 1, medium: 2, low: 3 };
  return analyzedProspects.sort((a, b) => {
    return priorityMap[a.priority] - priorityMap[b.priority];
  });
}
