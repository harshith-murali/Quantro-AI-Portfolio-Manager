import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRecommendations, recommendationOutputSchema } from '@/utils/recommendations';

test('Groq default uses structured responses and never calls paid fallback providers', async () => {
  const keys = ['AI_PROVIDER', 'GROQ_API_KEY', 'GROQ_MODEL'];
  const original = keys.map(key => process.env[key]);
  const originalFetch = global.fetch;
  const pick = { symbol: 'TCS', sector: 'IT', price: 3920, qty: 1, conviction: 'HIGH', rationale: 'Example', tag: 'Value' };
  try {
    // An empty selector also exercises the default with a local dotenv file present.
    process.env.AI_PROVIDER = '';
    process.env.GROQ_API_KEY = 'test-groq-key';
    process.env.GROQ_MODEL = '';
    const { generateAIResponse } = await import('./ai.service');
    const options = {
      requireProvider: true,
      outputSchema: recommendationOutputSchema,
      validate: (text: string) => JSON.stringify(parseRecommendations(text)),
    };
    let calls = 0;
    global.fetch = async (url, init) => {
      calls++;
      assert.equal(url, 'https://api.groq.com/openai/v1/chat/completions');
      assert.equal((init!.headers as Record<string, string>).Authorization, 'Bearer test-groq-key');
      const body = JSON.parse(init!.body as string);
      assert.equal(body.model, 'openai/gpt-oss-20b');
      assert.equal(body.response_format.json_schema.strict, true);
      assert.deepEqual(body.response_format.json_schema.schema, recommendationOutputSchema);
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ recommendations: [pick] }) }, finish_reason: 'stop' }] }));
    };
    assert.deepEqual(JSON.parse(await generateAIResponse('example prompt', options)), [pick]);
    assert.equal(calls, 1);

    calls = 0;
    global.fetch = async (url, init) => {
      calls++;
      assert.equal(url, 'https://api.groq.com/openai/v1/chat/completions');
      const body = JSON.parse(init!.body as string);
      if (calls === 1) {
        assert.equal(body.response_format.type, 'json_schema');
        return new Response(JSON.stringify({error: {code: 'json_validate_failed'}}), {status: 400});
      }
      assert.equal(body.response_format.type, 'json_object');
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({recommendations: [pick]}) }, finish_reason: 'stop' }] }));
    };
    assert.deepEqual(JSON.parse(await generateAIResponse('Return JSON recommendations', options)), [pick]);
    assert.equal(calls, 2);
    calls = 0;
    global.fetch = async () => { calls++; return new Response(JSON.stringify({error: {code: 'json_validate_failed'}}), {status: 400}); };
    await assert.rejects(generateAIResponse('Return JSON recommendations', options), /temporarily unavailable/);
    assert.equal(calls, 2, 'A schema failure has a bounded retry');

    for (const [status, expected] of [[400, /temporarily unavailable/], [429, /free-tier rate limit/], [401, /authentication failed/], [403, /authentication failed/], [500, /temporarily unavailable/]] as const) {
      calls = 0;
      global.fetch = async url => {
        calls++;
        assert.equal(url, 'https://api.groq.com/openai/v1/chat/completions');
        return new Response('', { status });
      };
      await assert.rejects(generateAIResponse('example prompt', options), expected);
      assert.equal(calls, 1);
    }
    for (const [content, finish_reason] of [['invalid prose', 'stop'], ['[]', 'length'], ['', 'stop']]) {
      global.fetch = async () => new Response(JSON.stringify({ choices: [{ message: { content }, finish_reason }] }));
      await assert.rejects(generateAIResponse('example prompt', options), /temporarily unavailable/);
    }
    global.fetch = async () => { throw new Error('Network failure'); };
    await assert.rejects(generateAIResponse('example prompt', options), /temporarily unavailable/);

    process.env.GROQ_API_KEY = '';
    global.fetch = async () => { assert.fail('Missing key must not make network requests'); };
    await assert.rejects(generateAIResponse('example prompt', options), /set GROQ_API_KEY/);
  } finally {
    global.fetch = originalFetch;
    keys.forEach((key, index) => {
      if (original[index] === undefined) delete process.env[key];
      else process.env[key] = original[index];
    });
  }
});
