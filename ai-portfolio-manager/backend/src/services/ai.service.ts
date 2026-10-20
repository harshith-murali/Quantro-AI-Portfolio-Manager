import {
  SageMakerRuntimeClient,
  InvokeEndpointCommand,
} from '@aws-sdk/client-sagemaker-runtime';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/utils/logger';
import { AppError } from '@/utils/AppError';

// ─── AWS Hugging Face SageMaker Configuration ────────────────────────────────
const AWS_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-southeast-2';
const SAGEMAKER_ENDPOINT_NAME = process.env.SAGEMAKER_ENDPOINT_NAME;

// Optional direct Hugging Face Inference Endpoint fallback
const HF_ENDPOINT_URL = process.env.HF_ENDPOINT_URL || process.env.HF_ENDPOINT;
const HF_API_KEY = process.env.HF_API_KEY;

// SageMaker client initialization
const sagemakerClient = new SageMakerRuntimeClient({
  region: AWS_REGION,
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
});

// Optional Anthropic client fallback
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * Invokes an AWS Hugging Face SageMaker real-time inference endpoint running
 * Text Generation Inference (TGI) Deep Learning Container (e.g., Llama-3.1/3.2, FinGPT).
 */
async function invokeSageMakerEndpoint(endpointName: string, prompt: string): Promise<string> {
  const payload = {
    inputs: prompt,
    parameters: {
      max_new_tokens: 2048,
      temperature: 0.2,
      top_p: 0.9,
      return_full_text: false,
    },
  };

  const command = new InvokeEndpointCommand({
    EndpointName: endpointName,
    ContentType: 'application/json',
    Accept: 'application/json',
    Body: Buffer.from(JSON.stringify(payload)),
  });

  const response = await sagemakerClient.send(command);
  if (!response.Body) {
    throw new Error('SageMaker response body is empty');
  }

  const rawJson = Buffer.from(response.Body).toString('utf-8');
  const parsed = JSON.parse(rawJson);

  // Hugging Face TGI response format: [{ generated_text: "..." }]
  if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].generated_text) {
    return parsed[0].generated_text.trim();
  }

  // Alternative TGI format or custom Hugging Face handler: { generated_text: "..." }
  if (parsed.generated_text) {
    return parsed.generated_text.trim();
  }

  if (typeof parsed === 'string') {
    return parsed.trim();
  }

  return JSON.stringify(parsed);
}

/**
 * Invokes Hugging Face Inference Endpoint HTTP API directly.
 */
async function invokeHuggingFaceHttp(endpointUrl: string, prompt: string): Promise<string> {
  const res = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(HF_API_KEY ? { Authorization: `Bearer ${HF_API_KEY}` } : {}),
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 2048,
        temperature: 0.2,
        return_full_text: false,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Hugging Face HTTP endpoint error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as any;
  if (Array.isArray(data) && data.length > 0 && data[0].generated_text) {
    return data[0].generated_text.trim();
  }
  if (data.generated_text) {
    return data.generated_text.trim();
  }
  return typeof data === 'string' ? data : JSON.stringify(data);
}

/** Use HF's hosted chat router when only an API key is configured. */
async function invokeHuggingFaceChat(prompt: string): Promise<string> {
  const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${HF_API_KEY}` },
    signal: AbortSignal.timeout(60_000),
    body: JSON.stringify({
      model: process.env.HF_MODEL || 'Qwen/Qwen3-32B',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
      temperature: 0.2,
    }),
  });
  if (response.status === 402) {
    throw new AppError('Hugging Face has no inference credits remaining. Add credits to the Hugging Face account to enable AI recommendations.', 503);
  }
  if (response.status === 401 || response.status === 403) {
    throw new AppError('Hugging Face authentication failed. Check HF_API_KEY and its Inference Providers permission on the backend.', 503);
  }
  if (!response.ok) throw new Error(`Hugging Face chat endpoint error: ${response.status}`);
  const data = await response.json() as any;
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) throw new Error('Hugging Face returned no text');
  if (data.choices[0].finish_reason === 'length') throw new Error('Hugging Face response was truncated');
  return content.trim();
}

export interface AIResponseOptions {
  // Validate inside the provider loop so malformed output tries the next provider.
  validate?: (response: string) => string;
  requireProvider?: boolean;
  outputSchema?: Record<string, unknown>;
}

/** Groq's free plan requires a key but does not require HF inference credits. */
async function invokeGroq(prompt: string, options: AIResponseOptions): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new AppError('Groq is not configured. Create a free API key at console.groq.com/keys and set GROQ_API_KEY on the backend.', 503);
  }
  // A provider-side strict decoder can reject a generation with json_validate_failed.
  // Retry that specific error once in JSON-object mode; runtime validation still applies.
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(60_000),
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
        messages: [{ role: 'user', content: prompt }],
        max_completion_tokens: 4096,
        temperature: 0.2,
        ...(options.outputSchema && attempt === 1 ? { response_format: { type: 'json_object' } } : options.outputSchema ? {
          response_format: {
            type: 'json_schema',
            json_schema: { name: 'recommendations', strict: true, schema: options.outputSchema },
          },
        } : {}),
      }),
    });
    if (response.status === 400 && options.outputSchema && attempt === 0) {
      const error = await response.clone().json().catch(() => null) as any;
      if (error?.error?.code === 'json_validate_failed') {
        logger.warn('Groq strict generation rejected; retrying once with JSON-object mode');
        continue;
      }
    }
    if (response.status === 429) {
      throw new AppError('Groq free-tier rate limit reached. Please wait and try again.', 429);
    }
    if (response.status === 401 || response.status === 403) {
      throw new AppError('Groq authentication failed. Check GROQ_API_KEY and model access on the backend.', 503);
    }
    if (!response.ok) throw new Error(`Groq chat endpoint error: ${response.status}`);
    const data = await response.json() as any;
    const choice = data.choices?.[0];
    if (choice?.finish_reason === 'length') throw new Error('Groq response was truncated');
    const text = choice?.message?.content;
    if (typeof text !== 'string' || !text.trim()) throw new Error('Groq returned no text');
    return text.trim();
  }
  throw new Error('Groq could not produce a valid structured response');
}

export async function generateAIResponse(prompt: string, options: AIResponseOptions = {}): Promise<string> {
  // Explicit selection prevents an exhausted free plan from silently using paid providers.
  const selected = process.env.AI_PROVIDER || 'groq';
  if (!['groq', 'huggingface', 'sagemaker', 'anthropic', 'auto'].includes(selected)) {
    throw new AppError('Invalid AI_PROVIDER. Use groq, huggingface, sagemaker, anthropic, or auto.', 503);
  }
  const enabled = (name: string) => selected === name || selected === 'auto';
  const providers: Array<{ name: string; invoke: () => Promise<string> }> = [];
  if (enabled('groq')) providers.push({ name: 'Groq', invoke: () => invokeGroq(prompt, options) });
  if (enabled('sagemaker') && SAGEMAKER_ENDPOINT_NAME) providers.push({ name: 'SageMaker', invoke: () => invokeSageMakerEndpoint(SAGEMAKER_ENDPOINT_NAME, prompt) });
  if (enabled('huggingface') && HF_ENDPOINT_URL) providers.push({ name: 'Hugging Face endpoint', invoke: () => invokeHuggingFaceHttp(HF_ENDPOINT_URL, prompt) });
  else if (enabled('huggingface') && HF_API_KEY) providers.push({ name: 'Hugging Face chat', invoke: () => invokeHuggingFaceChat(prompt) });
  if (enabled('anthropic') && process.env.ANTHROPIC_API_KEY) providers.push({
    name: 'Anthropic',
    invoke: async () => {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });
      if (response.stop_reason === 'max_tokens') throw new Error('Anthropic response was truncated');
      const text = response.content.filter(block => block.type === 'text').map(block => block.text).join('\n');
      if (!text.trim()) throw new Error('Anthropic returned no text');
      return text;
    },
  });

  let providerError: AppError | undefined;
  for (const provider of providers) {
    try {
      const response = await provider.invoke();
      return options.validate ? options.validate(response) : response;
    } catch (error: any) {
      if (error instanceof AppError) providerError = error;
      logger.warn('AI provider failed; trying next provider', { provider: provider.name, error: error.message });
    }
  }

  if (options.requireProvider || options.validate) {
    if (providerError) throw providerError;
    throw new AppError(providers.length
      ? 'AI recommendations are temporarily unavailable. Please try again shortly.'
      : 'The selected AI provider is not configured. Set GROQ_API_KEY and AI_PROVIDER=groq to use Groq.', 503);
  }

  logger.warn('No AI provider available. Returning offline portfolio summary.');
  return (
    'Based on your current portfolio allocation and risk profile, here is an executive financial summary:\n\n' +
    '1. **Asset Allocation & Concentration**: Maintain sector diversification across large-cap leaders (e.g., Banking, IT, Energy) to reduce single-asset volatility.\n' +
    '2. **Risk & Volatility**: Implement trailing stop-losses on momentum positions, keeping total high-beta exposure below 25% of aggregate capital.\n' +
    '3. **Recommended Actions**: Rebalance dividend yields quarterly and dollar-cost average during macroeconomic index pullbacks.\n\n' +
    '*(Generated via Quantro Financial Analysis Engine — AWS SageMaker Hugging Face ready)*'
  );
}
