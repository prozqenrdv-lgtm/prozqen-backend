import { callClaude, calculateTokenCost } from '../config/anthropic.js';
import logger from '../utils/logger.js';

/**
 * AGENT #1: PROSPECT FINDER
 * Identifie et qualifie les prospects selon les critères utilisateur
 * 
 * Input: Critères (localité, profil, type bien, budget, etc.)
 * Output: Liste de caractéristiques du prospect idéal + stratégie de recherche
 * Tokens: ~50 tokens par exécution
 */

export async function prospectFinderAgent(criteria) {
  try {
    logger.info('🔍 Prospect Finder agent started', { criteria });

    const prompt = `Tu es un expert en prospection immobilière. Basé sur les critères fournis, identifie le profil exact du prospect idéal et crée une stratégie de recherche optimale.

CRITÈRES FOURNIS:
${JSON.stringify(criteria, null, 2)}

RÉPONDS UNIQUEMENT EN JSON avec cette structure exacte:
{
  "prospect_profile": {
    "job_titles": ["liste des titres"],
    "job_keywords": ["mots-clés métier"],
    "company_types": ["type d'entreprise"],
    "company_keywords": ["mots-clés entreprise"],
    "industries": ["secteurs"],
    "locations": ["localisations"],
    "company_size": "small|medium|large|enterprise",
    "buying_power": "high|medium|low",
    "urgency": "high|medium|low"
  },
  "search_strategy": {
    "linkedin_search_terms": ["requête 1", "requête 2"],
    "boolean_search": "requête booléenne",
    "estimated_reach": 150,
    "priority_signals": ["signal 1", "signal 2"],
    "outreach_angle": "angle de prospection personnalisé"
  },
  "qualifying_questions": [
    "question 1",
    "question 2"
  ],
  "objection_handlers": {
    "too_busy": "réponse",
    "not_interested": "réponse"
  }
}`;

    const response = await callClaude([
      {
        role: 'user',
        content: prompt
      }
    ], {
      temperature: 0.7
    });

    // Parse JSON response
    let result;
    try {
      result = JSON.parse(response.content);
    } catch (error) {
      logger.warn('Failed to parse Claude response, returning raw content');
      result = {
        raw_response: response.content,
        error: 'Could not parse JSON'
      };
    }

    // Calculate cost
    const cost = calculateTokenCost(response.tokens.input, response.tokens.output);

    logger.info('✅ Prospect Finder agent completed', {
      tokensUsed: response.tokens.total,
      cost: `$${cost.toFixed(6)}`
    });

    return {
      success: true,
      agent: 'prospect-finder',
      data: result,
      tokens: {
        used: response.tokens.total,
        cost: cost
      }
    };

  } catch (error) {
    logger.error('❌ Prospect Finder agent error:', error);
    return {
      success: false,
      agent: 'prospect-finder',
      error: error.message
    };
  }
}

/**
 * Helper: Extract search terms from criteria
 */
export function extractSearchTerms(criteria) {
  const terms = [];

  if (criteria.city) terms.push(criteria.city);
  if (criteria.property_type) terms.push(criteria.property_type);
  if (criteria.investor_type) terms.push(criteria.investor_type);
  if (criteria.budget) terms.push(`budget ${criteria.budget}`);

  return terms;
}
