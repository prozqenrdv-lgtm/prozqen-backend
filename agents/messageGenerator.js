import { callClaude, calculateTokenCost } from '../config/anthropic.js';


/**
 * AGENT #2: MESSAGE GENERATOR
 * Crée des messages hyper-personnalisés basés sur le prospect
 * 
 * Input: Infos prospect (nom, titre, entreprise) + contexte utilisateur
 * Output: 3 messages (LinkedIn, Email, SMS) testés & optimisés
 * Tokens: ~30 tokens par prospect
 */

export async function messageGeneratorAgent(prospect, userContext) {
  try {
    console.log('✍️ Message Generator agent started', {
      prospectName: prospect.name,
      prospectTitle: prospect.job_title
    });

    const prompt = `Tu es un expert en prospection B2B immobilière avec un taux de réponse de 25-40%.

INFORMATIONS PROSPECT:
${JSON.stringify(prospect, null, 2)}

CONTEXTE UTILISATEUR (MON OFFRE):
${JSON.stringify(userContext, null, 2)}

Crée 3 messages hyper-personnalisés (LinkedIn, Email, SMS) qui:
1. Prouvent que tu as fait tes recherches sur le prospect
2. Créent un sentiment d'urgence sans être agressif
3. Proposent une petite valeur AVANT de demander un appel
4. Includent un angle d'attaque unique
5. Sont courts et directs (surtout SMS)

RÉPONDS UNIQUEMENT EN JSON:
{
  "linkedin_message": {
    "text": "message LinkedIn (2-3 phrases max)",
    "tone": "professionnelle|amicale|urgente",
    "hook": "l'accroche principale",
    "cta": "call-to-action spécifique"
  },
  "email_message": {
    "subject": "sujet email accrocheur",
    "body": "corps de l'email",
    "ps": "post-scriptum accrocheur",
    "tone": "professionnelle|amicale|urgente"
  },
  "sms_message": {
    "text": "message SMS (max 160 caractères)",
    "tone": "amicale|urgente"
  },
  "estimated_response_rate": "15-25%|25-35%|35-45%",
  "key_differentiators": ["différenciation 1", "différenciation 2"],
  "follow_up_timing": {
    "day_1": "message initial",
    "day_5": "1ère relance",
    "day_10": "2ème relance",
    "day_15": "3ème relance"
  }
}`;

    const response = await callClaude([
      {
        role: 'user',
        content: prompt
      }
    ], {
      temperature: 0.8
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

    console.log('✅ Message Generator agent completed', {
      prospectName: prospect.name,
      tokensUsed: response.tokens.total,
      cost: `$${cost.toFixed(6)}`
    });

    return {
      success: true,
      agent: 'message-generator',
      prospect_id: prospect.id,
      data: result,
      tokens: {
        used: response.tokens.total,
        cost: cost
      }
    };

  } catch (error) {
    console.error('❌ Message Generator agent error:', error);
    return {
      success: false,
      agent: 'message-generator',
      prospect_id: prospect.id,
      error: error.message
    };
  }
}

/**
 * Helper: Validate message quality
 */
export function validateMessageQuality(messages) {
  const issues = [];

  if (!messages.linkedin_message?.text || messages.linkedin_message.text.length < 20) {
    issues.push('LinkedIn message too short');
  }

  if (!messages.email_message?.subject || messages.email_message.subject.length < 5) {
    issues.push('Email subject too short');
  }

  if (!messages.sms_message?.text || messages.sms_message.text.length < 10) {
    issues.push('SMS message too short');
  }

  if (messages.sms_message?.text?.length > 160) {
    issues.push('SMS message exceeds 160 characters');
  }

  return {
    isValid: issues.length === 0,
    issues: issues
  };
}
