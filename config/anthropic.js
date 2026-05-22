import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client lazily
let _client = null;

function getClient() {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not found in environment variables');
    }
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

export const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';

export async function callClaude(messages, options = {}) {
  try {
    const client = getClient();
    const response = await client.messages.create({
      model: options.model || CLAUDE_MODEL,
      max_tokens: options.maxTokens || 1024,
      messages: messages,
      system: options.system || undefined,
      temperature: options.temperature || 0.7,
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
    console.error('Claude API error:', error.message);
    throw new Error(`Claude API call failed: ${error.message}`);
  }
}

export function calculateTokenCost(inputTokens, outputTokens) {
  return (inputTokens * 0.000001) + (outputTokens * 0.000005);
}
