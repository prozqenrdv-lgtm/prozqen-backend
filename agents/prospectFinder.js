import { callClaude, calculateTokenCost } from '../config/anthropic.js';

export async function prospectFinderAgent(criteria) {
  try {
    console.log('🔍 Prospect Finder started', { criteria });

    const prompt = `Tu es un expert en prospection immobilière. Basé sur ces critères, identifie le profil du prospect idéal et crée une stratégie de recherche.

CRITÈRES:
${JSON.stringify(criteria, null, 2)}

Réponds UNIQUEMENT en JSON valide (sans backticks, sans markdown):
{
  "prospect_profile": {
    "job_titles": ["titre 1", "titre 2"],
    "industries": ["secteur 1"],
    "locations": ["ville 1"],
    "buying_power": "high"
  },
  "search_strategy": {
    "linkedin_search_terms": ["terme 1", "terme 2"],
    "estimated_reach": 150,
    "outreach_angle": "angle personnalisé"
  },
  "qualifying_questions": ["question 1", "question 2"]
}`;

    const response = await callClaude([{ role: 'user', content: prompt }], { temperature: 0.7 });

    const result = parseJSON(response.content);
    const cost = calculateTokenCost(response.tokens.input, response.tokens.output);

    console.log('✅ Prospect Finder done', { tokens: response.tokens.total });

    return {
      success: true,
      agent: 'prospect-finder',
      data: result,
      tokens: { used: response.tokens.total, cost }
    };
  } catch (error) {
    console.error('❌ Prospect Finder error:', error.message);
    return { success: false, agent: 'prospect-finder', error: error.message };
  }
}

function parseJSON(text) {
  try {
    // Remove markdown backticks if present
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return { raw_response: text };
  }
}
