import { callClaude, calculateTokenCost } from '../config/anthropic.js';


/**
 * AGENT #3: FOLLOW-UP AUTOMATION
 * Gère les relances intelligentes basées sur le statut du prospect
 * 
 * Input: Prospect + historique de communication
 * Output: Plan de relance optimisé (5j, 10j, 15j, 20j)
 * Tokens: ~20 tokens par relance
 */

export async function followupAutomationAgent(prospect, communicationHistory, userContext) {
  try {
    console.log('📧 Follow-up Automation agent started', {
      prospectName: prospect.name,
      daysSinceContact: prospect.days_since_last_contact || 0
    });

    // Determine escalation level based on communication history
    const escalationLevel = determineEscalation(communicationHistory);

    const prompt = `Tu es un expert en prospection immobilière et tu gères les relances intelligentes.

PROSPECT:
${JSON.stringify(prospect, null, 2)}

HISTORIQUE DE COMMUNICATION:
${JSON.stringify(communicationHistory, null, 2)}

NIVEAU D'ESCALADE: ${escalationLevel}

Crée un plan de relance stratégique qui:
1. S'adapte au niveau d'escalade (doux → moyen → direct)
2. Introduit une nouvelle valeur à chaque étape
3. Crée de la curiosité sans être agressif
4. Apporte des raisons additionnelles de répondre
5. Utilise différents angles à chaque relance

RÉPONDS UNIQUEMENT EN JSON:
{
  "escalation_level": "soft|medium|aggressive",
  "relances": {
    "day_5": {
      "angle": "angle unique jour 5",
      "message": "message de relance court",
      "subject_line": "sujet email",
      "hook": "l'accroche",
      "tone": "tone recommandée"
    },
    "day_10": {
      "angle": "angle unique jour 10",
      "message": "message de relance",
      "subject_line": "sujet email",
      "hook": "l'accroche",
      "tone": "tone recommandée",
      "added_value": "valeur ajoutée"
    },
    "day_15": {
      "angle": "angle unique jour 15",
      "message": "message de relance plus direct",
      "subject_line": "sujet email",
      "hook": "l'accroche",
      "tone": "tone recommandée",
      "urgency_factor": "urgence créée"
    },
    "day_20": {
      "angle": "dernier angle avant pause",
      "message": "message final ou pause",
      "subject_line": "sujet email",
      "decision_requested": "demande de décision claire",
      "fallback_option": "alternative proposée"
    }
  },
  "success_probability": "15-25%|25-40%|40-60%",
  "next_best_action_if_no_response": "recommandation si pas de réponse",
  "timing_notes": "notes sur le timing optimal"
}`;

    const response = await callClaude([
      {
        role: 'user',
        content: prompt
      }
    ], {
      temperature: 0.75
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

    console.log('✅ Follow-up Automation agent completed', {
      prospectName: prospect.name,
      escalationLevel,
      tokensUsed: response.tokens.total,
      cost: `$${cost.toFixed(6)}`
    });

    return {
      success: true,
      agent: 'followup-automation',
      prospect_id: prospect.id,
      data: result,
      escalation_level: escalationLevel,
      tokens: {
        used: response.tokens.total,
        cost: cost
      }
    };

  } catch (error) {
    console.error('❌ Follow-up Automation agent error:', error);
    return {
      success: false,
      agent: 'followup-automation',
      prospect_id: prospect.id,
      error: error.message
    };
  }
}

/**
 * Helper: Determine escalation level
 */
function determineEscalation(communicationHistory) {
  if (!communicationHistory || communicationHistory.length === 0) {
    return 'soft';
  }

  const messageCount = communicationHistory.length;
  const hasResponse = communicationHistory.some(msg => msg.is_response);

  if (hasResponse) return 'medium';
  if (messageCount >= 3) return 'aggressive';
  if (messageCount >= 2) return 'medium';

  return 'soft';
}

/**
 * Helper: Schedule follow-up dates
 */
export function scheduleFollowupDates(initialContactDate) {
  const baseDate = new Date(initialContactDate);

  return {
    day_5: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000),
    day_10: new Date(baseDate.getTime() + 10 * 24 * 60 * 60 * 1000),
    day_15: new Date(baseDate.getTime() + 15 * 24 * 60 * 60 * 1000),
    day_20: new Date(baseDate.getTime() + 20 * 24 * 60 * 60 * 1000)
  };
}
