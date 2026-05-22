import { callClaude, calculateTokenCost } from '../config/anthropic.js';

export async function followupAutomationAgent(prospect, communicationHistory, userContext) {
  try {
    console.log('🔄 Follow-up Automation started', { prospect: prospect.name });

    const prompt = `Tu es un expert en prospection immobilière et tu gères les relances.

PROSPECT: ${prospect.name || 'Prospect'} - ${prospect.job_title || 'Directeur'} chez ${prospect.company || 'Entreprise'}
VILLE: ${prospect.city || 'Paris'}
MON AGENCE: ${userContext.company_name || 'Mon Agence'}

Crée un plan de relance. Réponds UNIQUEMENT en JSON valide (sans backticks):
{
  "relances": {
    "day_5": {
      "message": "message de relance jour 5",
      "subject_line": "sujet email",
      "tone": "amical"
    },
    "day_10": {
      "message": "message relance jour 10",
      "subject_line": "sujet email",
      "tone": "direct"
    },
    "day_15": {
      "message": "message relance jour 15",
      "subject_line": "sujet email",
      "tone": "urgent"
    }
  },
  "success_probability": "25-35%",
  "timing_notes": "Meilleur moment: mardi-jeudi 9h-11h"
}`;

    const response = await callClaude([{ role: 'user', content: prompt }], { temperature: 0.7 });
    const result = parseJSON(response.content);
    const cost = calculateTokenCost(response.tokens.input, response.tokens.output);

    console.log('✅ Follow-up done', { tokens: response.tokens.total });

    return {
      success: true,
      agent: 'followup-automation',
      data: result,
      tokens: { used: response.tokens.total, cost }
    };
  } catch (error) {
    console.error('❌ Follow-up error:', error.message);
    return { success: false, agent: 'followup-automation', error: error.message };
  }
}

function parseJSON(text) {
  try {
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return { raw_response: text };
  }
}
