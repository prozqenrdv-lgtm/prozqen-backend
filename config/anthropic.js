import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';


dotenv.config({ path: '.env.local' });

// Initialize Anthropic client
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ==========================================
// MODELS & CONFIG
// ==========================================

export const CLAUDE_MODEL = 'claude-opus-4-1';
export const CLAUDE_MAX_TOKENS = 2048;

// Tokens costs (approximate, as of May 2026)
export const TOKEN_COSTS = {
  // Opus 4.1
  'claude-opus-4-1': {
    input: 0.000015,  // $15 per million tokens
    output: 0.000075  // $75 per million tokens
  },
  // Sonnet 4
  'claude-sonnet-4': {
    input: 0.000003,   // $3 per million tokens
    output: 0.000015   // $15 per million tokens
  },
  // Haiku 3
  'claude-haiku-3': {
    input: 0.00000025, // $0.25 per million tokens
    output: 0.00000125 // $1.25 per million tokens
  }
};

// ==========================================
// CALL CLAUDE API WITH ERROR HANDLING
// ==========================================

export async function callClaude(messages, options = {}) {
  try {
    const response = await anthropic.messages.create({
      model: options.model || CLAUDE_MODEL,
      max_tokens: options.maxTokens || CLAUDE_MAX_TOKENS,
      messages: messages,
      system: options.system || undefined,
      temperature: options.temperature || 0.7,
    });

    // Log API usage
    console.log('Claude API call:', {
      model: options.model || CLAUDE_MODEL,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens
    });

    return {
      content: response.content[0].text,
      tokens: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        total: response.usage.input_tokens + response.usage.output_tokens
      }
    };
  } catch (error) {
    console.error('Claude API error:', error);
    throw new Error(`Claude API call failed: ${error.message}`);
  }
}

// ==========================================
// CALCULATE TOKEN COST
// ==========================================

export function calculateTokenCost(inputTokens, outputTokens, model = CLAUDE_MODEL) {
  const costs = TOKEN_COSTS[model];
  if (!costs) {
    console.warn(`Unknown model: ${model}`);
    return 0;
  }

  const inputCost = inputTokens * costs.input;
  const outputCost = outputTokens * costs.output;
  return inputCost + outputCost;
}

// ==========================================
// VERIFY API KEY
// ==========================================

export async function verifyAnthropicKey() {
  try {
    // Try a simple API call to verify the key works
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 10,
      messages: [
        {
          role: 'user',
          content: 'Say OK'
        }
      ]
    });

    console.log('✅ Anthropic API key verified successfully');
    return true;
  } catch (error) {
    console.error('❌ Anthropic API key verification failed:', error.message);
    return false;
  }
}

// ==========================================
// INITIALIZE ON STARTUP
// ==========================================

export async function initializeAnthropicClient() {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not found in .env');
    }

    const isValid = await verifyAnthropicKey();
    if (!isValid) {
      throw new Error('Invalid Anthropic API key');
    }

    console.log('✅ Anthropic client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Anthropic client:', error);
    throw error;
  }
}
