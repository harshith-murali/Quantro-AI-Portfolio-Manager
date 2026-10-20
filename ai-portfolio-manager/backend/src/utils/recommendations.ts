import { z } from 'zod';

// Providers that require a JSON object wrap the array; parseRecommendations unwraps it.
export const recommendationOutputSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['recommendations'],
  properties: {
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['symbol', 'sector', 'price', 'qty', 'conviction', 'rationale', 'tag'],
        properties: {
          symbol: { type: 'string' },
          sector: { type: 'string' },
          price: { type: 'number' },
          qty: { type: 'integer' },
          conviction: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] },
          rationale: { type: 'string' },
          tag: { type: 'string' },
        },
      },
    },
  },
};

const recommendationSchema = z.array(z.object({
  symbol: z.string().trim().min(1),
  sector: z.string().trim().min(1),
  price: z.number().finite().positive(),
  qty: z.number().int().positive(),
  conviction: z.union([z.enum(['HIGH', 'MEDIUM', 'LOW']), z.number().int().min(1).max(3)]),
  rationale: z.string().trim().min(1),
  tag: z.string().trim().min(1),
}));

/** Accept plain JSON, fenced JSON, or JSON surrounded by a model's explanation. */
export function parseRecommendations(response: string) {
  const text = response.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const candidates = [text];
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start >= 0 && end > start) candidates.push(text.slice(start, end + 1));
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      return recommendationSchema.parse(Array.isArray(parsed) ? parsed : parsed?.recommendations);
    } catch { /* Try the array embedded in explanatory text. */ }
  }
  throw new Error('AI response does not contain a valid recommendation array');
}
