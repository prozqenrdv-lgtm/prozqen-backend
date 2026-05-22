import { callClaude, calculateTokenCost } from '../config/anthropic.js';

export async function messageGeneratorAgent(prospect, userContext) {
  try {
    console.log('✍️ Message Generator started', { prospect: prospect.name });

    const prompt = `Tu es un expert en prospection B2B immobilière avec un taux de réponse de 25-40%.

PROSPECT:
${JSON.stringify(prospect, null, 2)}

MON AGENCE: ${userContext.company_name || 'Mon Agence Immobilière'}

Crée 3 messages personnalisés. Réponds UNIQUEMENT en JSON valide (sans backticks):
{
  "linkedin_message": {
    "text": "message LinkedIn court et percutant",
    "cta": "call-to-action"
  },
  "email_message": {
    "subject": "sujet accrocheur",
    "body": "corps de l'email"
  },
  "sms_message": {
    "text": "SMS court max 160 caractères"
  },
  "estimated_response_rate": "20-30%",
  "key_differentiators": ["point fort 1", "point fort 2"]
}`;

    const response = await callClaude([{ role: 'user', content: prompt }], { temperature: 0.8 });
    const result = parseJSON(response.content);
    const cost = calculateTokenCost(response.tokens.input, response.tokens.output);

    console.log('✅ Message Generator done', { tokens: response.tokens.total });

    return {
      success: true,
      agent: 'message-generator',
      data: result,
      tokens: { used: response.tokens.total, cost }
    };
  } catch (error) {
    console.error('❌ Message Generator error:', error.message);
    return { success: false, agent: 'message-generator', error: error.message };
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
