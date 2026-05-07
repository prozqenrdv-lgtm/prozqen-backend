/**
 * EMAIL VALIDATOR
 */
export function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * PASSWORD VALIDATOR
 */
export function validatePassword(password) {
  // Min 8 chars, at least 1 uppercase, 1 lowercase, 1 number
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regex.test(password);
}

/**
 * LINKEDIN URL VALIDATOR
 */
export function validateLinkedInUrl(url) {
  return /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/.test(url);
}

/**
 * PROSPECT DATA VALIDATOR
 */
export function validateProspectData(prospect) {
  const errors = [];

  if (!prospect.name || prospect.name.length < 2) {
    errors.push('Invalid name');
  }

  if (!validateEmail(prospect.email)) {
    errors.push('Invalid email');
  }

  if (prospect.linkedin_url && !validateLinkedInUrl(prospect.linkedin_url)) {
    errors.push('Invalid LinkedIn URL');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * AGENT CONFIG VALIDATOR
 */
export function validateAgentConfig(config) {
  const errors = [];

  if (!Array.isArray(config.agents)) {
    errors.push('agents must be an array');
  }

  if (config.agents.length === 0) {
    errors.push('At least one agent required');
  }

  const validAgents = [
    'prospect-finder',
    'message-generator',
    'followup-automation',
    'deal-analyzer',
    'crm-sync',
    'performance-optimizer'
  ];

  for (const agent of config.agents) {
    if (!validAgents.includes(agent)) {
      errors.push(`Unknown agent: ${agent}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * CRM CONFIG VALIDATOR
 */
export function validateCrmConfig(config) {
  const errors = [];

  if (!['pipedrive', 'hubspot', 'zendesk'].includes(config.type)) {
    errors.push('Invalid CRM type');
  }

  if (!config.api_key || config.api_key.length < 5) {
    errors.push('Invalid API key');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}
