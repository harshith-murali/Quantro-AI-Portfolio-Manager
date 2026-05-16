const fs = require('fs');

async function testAnalyticsFlow() {
  console.log('🚀 Starting Analytics / Dashboard Aggregator Integration Tests...\n');

  // 1. Create fresh user
  console.log('1️⃣  Registering Test User...');
  const regRes = await fetch('http://localhost:8080/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Analytics Guru',
      email: `metrics_${Date.now()}@quantro.dev`,
      password: 'Password123!',
    }),
  });
  const regData = await regRes.json();
  const token = regData.data.accessToken;
  console.log('✅ Registered! Access token obtained.\n');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 2. Initial Baseline Fetch (Zero Values)
  console.log('2️⃣  Querying baseline empty Dashboard Summary...');
  const startBaseline = Date.now();
  const initialSummaryRes = await fetch('http://localhost:8080/api/dashboard/summary', { headers });
  const initialData = await initialSummaryRes.json();
  console.log(`Response (${Date.now() - startBaseline}ms):`, JSON.stringify(initialData.data, null, 2), '\n');

  // 3. Validate Caching mechanics (Repeat Call)
  console.log('3️⃣  Executing Repeat call to Assert caching speedup...');
  const startCached = Date.now();
  const cachedSummaryRes = await fetch('http://localhost:8080/api/dashboard/summary', { headers });
  const cachedData = await cachedSummaryRes.json();
  const speed = Date.now() - startCached;
  console.log(`Response (${speed}ms):`, cachedData.message, '\n');
  if (speed < 15) {
    console.log('🔥 Sub-15ms execution! Cache HIT confirmed.');
  }

  // 4. Add Virtual Balance to Wallet
  console.log('\n4️⃣  Executing Deposit of $50,000 (Should bust Summary cache)...');
  const depRes = await fetch('http://localhost:8080/api/wallet/deposit', {
    method: 'POST',
    headers,
    body: JSON.stringify({ amount: 50000, description: 'Analytics Seed Capital' }),
  });
  await depRes.json();
  console.log('✅ Deposit Complete.');

  // 5. Assert Cache-Busted Value reflection
  console.log('5️⃣  Fetching Summary again to assert cache invalidation...');
  const freshSummaryRes = await fetch('http://localhost:8080/api/dashboard/summary', { headers });
  const freshSummary = await freshSummaryRes.json();
  console.log('Updated Wallet Balance:', freshSummary.data.walletBalance);
  if (freshSummary.data.walletBalance === 50000) {
    console.log('✅ Invalidation Successful! Cache refreshed to live ledger total.');
  }

  // 6. Execute Trade - Buying RELIANCE (Energy Sector)
  console.log('\n6️⃣  Executing BUY: 10 shares of RELIANCE @ ₹2,500 (Total ₹25,000)...');
  const buyRes = await fetch('http://localhost:8080/api/trade/buy', {
    method: 'POST',
    headers,
    body: JSON.stringify({ symbol: 'RELIANCE', quantity: 10, price: 2500 }),
  });
  const buyData = await buyRes.json();
  console.log('Trade Execution Result:', buyData.message);

  // 7. Query Sector Allocations
  console.log('\n7️⃣  Fetching Sector Breakdown chart model...');
  const sectorRes = await fetch('http://localhost:8080/api/dashboard/sector-allocation', { headers });
  const sectorData = await sectorRes.json();
  console.log('Sector Allocations:', JSON.stringify(sectorData.data, null, 2));

  // 8. Query Holdings table
  console.log('\n8️⃣  Fetching Detailed Holdings Table...');
  const holdingsRes = await fetch('http://localhost:8080/api/dashboard/holdings-table', { headers });
  const holdingsData = await holdingsRes.json();
  console.log('Holdings Grid:', JSON.stringify(holdingsData.data, null, 2));

  // 9. Unified Recent Activity Feed
  console.log('\n9️⃣  Querying combined Activity Stream (Trades + Transactions)...');
  const activityRes = await fetch('http://localhost:8080/api/dashboard/recent-activity', { headers });
  const activityData = await activityRes.json();
  console.log('Recent Feed Items:', JSON.stringify(activityData.data, null, 2));
}

testAnalyticsFlow().catch(console.error);
