import Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/utils/logger';

// Initialize the Anthropic client. It will automatically use the ANTHROPIC_API_KEY environment variable.
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function generateAIResponse(prompt: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    logger.error('ANTHROPIC_API_KEY is not set in the environment variables.');
    return 'AI insights are temporarily unavailable because the API key is not configured. Please contact the administrator.';
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    // The SDK returns content as an array of content blocks.
    // For simple text requests, the first block contains the text.
    if (response.content && response.content.length > 0 && response.content[0].type === 'text') {
      return response.content[0].text;
    }

    return 'Received an unexpected response format from the AI.';
  } catch (error: any) {
    logger.error('Error generating AI response:', { error: error.message, stack: error.stack });
    
    // Provide a graceful fallback message as requested
    return 'AI insights are temporarily unavailable. Please try again shortly.';
  }
}
