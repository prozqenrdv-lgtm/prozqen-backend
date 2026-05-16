import { callClaude, calculateTokenCost } from '../config/anthropic.js';


/**
 * AGENT #5: CRM SYNC (PRO ONLY)
 * Synchronise automatiquement les données avec Pipedrive/HubSpot/Zendesk
 * 
 * Input: Prospect data + CRM configuration
 * Output: Formatted data + sync status
 * Tokens: ~15 tokens par sync
 */

export async function crmSyncAgent(prospect, crmConfig) {
  try {
    console.log('🔗 CRM Sync agent started', {
      prospectName: prospect.name,
      crmType: crmConfig.type
    });

    const crmInstructions = getCrmInstructions(crmConfig.type);

    const prompt = `Tu es un expert en intégration CRM. Formate les données du prospect pour synchronisation avec ${crmConfig.type}.

${crmInstructions}

DONNÉES PROSPECT:
${JSON.stringify(prospect, null, 2)}

CONFIGURATION CRM:
${JSON.stringify(crmConfig, null, 2)}

Crée un payload JSON prêt à être envoyé au CRM avec:
1. Tous les champs mappés correctement
2. Formats de date/devise corrects
3. Champs custom si applicable
4. Tags/labels pour organisation
5. Pipeline stage recommandé

RÉPONDS UNIQUEMENT EN JSON:
{
  "crm_type": "${crmConfig.type}",
  "payload": {
    "formatted_fields": {},
    "custom_fields": {},
    "tags": [],
    "pipeline_stage": "stage recommandé",
    "owner_assignment": "suggestion",
    "notes": "notes CRM formattées"
  },
  "validation": {
    "is_valid": true,
    "issues": [],
    "warnings": []
  },
  "sync_status": "ready",
  "fields_mapped": 10,
  "missing_fields": []
}`;

    const response = await callClaude([
      {
        role: 'user',
        content: prompt
      }
    ], {
      temperature: 0.5  // Very low temperature for data formatting
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

    console.log('✅ CRM Sync agent completed', {
      prospectName: prospect.name,
      crmType: crmConfig.type,
      tokensUsed: response.tokens.total,
      cost: `$${cost.toFixed(6)}`
    });

    return {
      success: true,
      agent: 'crm-sync',
      prospect_id: prospect.id,
      data: result,
      tokens: {
        used: response.tokens.total,
        cost: cost
      }
    };

  } catch (error) {
    console.error('❌ CRM Sync agent error:', error);
    return {
      success: false,
      agent: 'crm-sync',
      prospect_id: prospect.id,
      error: error.message
    };
  }
}

/**
 * Helper: Get CRM-specific instructions
 */
function getCrmInstructions(crmType) {
  const instructions = {
    pipedrive: `
PIPEDRIVE MAPPING:
- Name: person name
- Email: person email
- Phone: person phone
- Organization: company name
- Position: job title
- Labels: tags (comma separated)
- Pipeline: Real Estate (default)
- Stage: Follow Up (default)
Custom fields: property_type, budget, location
    `,
    hubspot: `
HUBSPOT MAPPING:
- firstname: first name
- lastname: last name
- email: email
- phone: phone
- company: company name
- jobtitle: job title
- hs_lead_status: Subscriber (default)
- lifecyclestage: marketingqualifiedlead
Custom properties: property_type, budget, location
    `,
    zendesk: `
ZENDESK MAPPING:
- name: full name
- email: email
- phone: phone
- organization: company
- custom_fields: {property_type, budget}
- tags: from prospect tags
- status: new
    `
  };

  return instructions[crmType] || instructions.pipedrive;
}

/**
 * Helper: Validate CRM payload
 */
export function validateCrmPayload(payload, crmType) {
  const requiredFields = {
    pipedrive: ['name', 'email'],
    hubspot: ['firstname', 'lastname', 'email'],
    zendesk: ['name', 'email']
  };

  const required = requiredFields[crmType] || requiredFields.pipedrive;
  const missing = required.filter(field => !payload.payload.formatted_fields[field]);

  return {
    isValid: missing.length === 0,
    missingFields: missing
  };
}
