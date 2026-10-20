import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRecommendations } from './recommendations';

const pick = { symbol: 'TCS', sector: 'IT', price: 3920, qty: 1, conviction: 'HIGH', rationale: 'Example rationale', tag: 'Value' };
const json = JSON.stringify([pick]);

test('recommendations accept plain, fenced, wrapped, and explained JSON', () => {
  for (const response of [json, '```json\n' + json + '\n```', JSON.stringify({ recommendations: [pick] }), 'Picks:\n' + json + '\nDisclaimer.']) {
    assert.deepEqual(parseRecommendations(response), [pick]);
  }
  assert.deepEqual(parseRecommendations('[]'), []);
});

test('recommendations reject offline prose, truncated JSON, and invalid financial fields', () => {
  for (const response of ['Offline portfolio summary', json.slice(0, -1), '{}', '[null]', JSON.stringify([{ ...pick, price: -1 }]), JSON.stringify([{ ...pick, qty: 0.5 }]), JSON.stringify([{ symbol: 'TCS' }])]) {
    assert.throws(() => parseRecommendations(response));
  }
});
