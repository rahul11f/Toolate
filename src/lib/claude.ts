import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY;

// Initialize the Anthropic client only if the key is provided
export const anthropic = apiKey ? new Anthropic({ apiKey }) : null;

export const CLAUDE_MODEL = 'claude-3-5-haiku-20241022';

/**
 * Generate a description, estimate rent, or check fraud using Claude if the API key is present.
 * Otherwise, fall back to mock helper functions.
 */
export async function queryClaude(
  prompt: string,
  systemPrompt: string,
  mockResponse: string
): Promise<string> {
  if (!anthropic) {
    console.warn('ANTHROPIC_API_KEY is not defined. Using mock response mode.');
    // Simulate slight delay for realism
    await new Promise((resolve) => setTimeout(resolve, 800));
    return mockResponse;
  }

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content && content.type === 'text') {
      return content.text;
    }
    throw new Error('Unexpected response format from Claude');
  } catch (error) {
    console.error('Claude API call failed:', error);
    // Fallback to mock instead of crashing if API call fails
    return mockResponse;
  }
}
