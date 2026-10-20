import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRecommendations } from '@/utils/recommendations';

test('HF key alone routes chat requests and structured calls never receive offline prose', async () => {
  const keys = ['AI_PROVIDER', 'GROQ_API_KEY', 'HF_API_KEY', 'HF_ENDPOINT_URL', 'HF_ENDPOINT', 'SAGEMAKER_ENDPOINT_NAME', 'ANTHROPIC_API_KEY'];
  const original = keys.map(key => process.env[key]);
  const originalFetch = global.fetch;
  try {
    keys.forEach(key => { process.env[key] = ''; });
    process.env.HF_API_KEY = 'test-key';
    process.env.AI_PROVIDER = 'huggingface';
    const { generateAIResponse } = await import('./ai.service');
    let requests = 0;
    global.fetch = async (url, init) => {
      requests++;
      assert.equal(url, 'https://router.huggingface.co/v1/chat/completions');
      const body = JSON.parse(init!.body as string);
      assert.equal(body.messages[0].content, 'test prompt');
      return new Response(JSON.stringify({ choices: [{ message: { content: '[]' }, finish_reason: 'stop' }] }));
    };
    const options = { requireProvider: true, validate: (text: string) => JSON.stringify(parseRecommendations(text)) };
    assert.equal(await generateAIResponse('test prompt', options), '[]');
    assert.equal(requests, 1);

    for (const result of [
      { choices: [{ message: { content: 'Offline summary' }, finish_reason: 'stop' }] },
      { choices: [{ message: { content: '[]' }, finish_reason: 'length' }] },
      { error: 'Unavailable' },
    ]) {
      global.fetch = async () => new Response(JSON.stringify(result));
      await assert.rejects(generateAIResponse('test prompt', options), { statusCode: 503 });
    }
    global.fetch = async () => new Response('', { status: 401 });
    await assert.rejects(generateAIResponse('test prompt', options), { statusCode: 503 });
    global.fetch = async () => new Response('', { status: 402 });
    await assert.rejects(generateAIResponse('test prompt', options), /no inference credits remaining/);
  } finally {
    global.fetch = originalFetch;
    keys.forEach((key, index) => {
      if (original[index] === undefined) delete process.env[key];
      else process.env[key] = original[index];
    });
  }
});
