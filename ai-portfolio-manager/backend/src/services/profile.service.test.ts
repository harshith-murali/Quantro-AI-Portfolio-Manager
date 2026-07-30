import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateInvestableAmount } from '@/services/profile.service';

test('calculateInvestableAmount subtracts expenses and emergency buffer', () => {
  assert.equal(calculateInvestableAmount(100000, 50000), 30000);
});

test('calculateInvestableAmount floors negative capacity at zero', () => {
  assert.equal(calculateInvestableAmount(50000, 60000), 0);
});
