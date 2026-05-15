const fs = require('fs');

async function testInsightsFlow() {
  console.log('🚀 Starting AI Insights Service Test...\n');

  // 1. Register User
  console.log('1️⃣  Registering Test User...');
  const regRes = await fetch('http://localhost:8080/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'AI Investor',
      email: `ai_${Date.now()}@fintech.dev`,
      password: 'Password123!',
    }),
  });
  const regData = await regRes.json();
  const token = regData.data.accessToken;
  console.log('✅ Registered! Access Token acquired.\n');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 2. Test Portfolio Summary
  console.log('2️⃣  Generating Portfolio Summary...');
  const startTimeSummary = Date.now();
  const summaryRes = await fetch('http://localhost:8080/api/insights/portfolio-summary', { method: 'POST', headers });
  const summaryTime = Date.now() - startTimeSummary;
  console.log(`Response (${summaryTime}ms):`, JSON.stringify(await summaryRes.json(), null, 2), '\n');

  // 3. Test Caching (Should be much faster)
  console.log('3️⃣  Testing Caching on Portfolio Summary...');
  const startTimeCache = Date.now();
  const cacheRes = await fetch('http://localhost:8080/api/insights/portfolio-summary', { method: 'POST', headers });
  const cacheTime = Date.now() - startTimeCache;
  console.log(`Response (${cacheTime}ms):`, JSON.stringify(await cacheRes.json(), null, 2), '\n');

  // 4. Test Stock Insight
  console.log('4️⃣  Generating Stock Insight for RELIANCE...');
  const stockRes = await fetch('http://localhost:8080/api/insights/stock/RELIANCE', { method: 'POST', headers });
  console.log('Response:', JSON.stringify(await stockRes.json(), null, 2), '\n');

  // 5. Test Risk Analysis
  console.log('5️⃣  Generating Risk Analysis...');
  const riskRes = await fetch('http://localhost:8080/api/insights/risk-analysis', { method: 'POST', headers });
  console.log('Response:', JSON.stringify(await riskRes.json(), null, 2), '\n');

  // 6. Test General QA
  console.log('6️⃣  Asking General Question...');
  const askRes = await fetch('http://localhost:8080/api/insights/ask', {
    method: 'POST',
    headers,
    body: JSON.stringify({ question: 'What is the difference between a stock and a bond?' }),
  });
  console.log('Response:', JSON.stringify(await askRes.json(), null, 2), '\n');

  // 7. Test History
  console.log('7️⃣  Fetching Insight History...');
  const historyRes = await fetch('http://localhost:8080/api/insights/history', { method: 'GET', headers });
  console.log('Response:', JSON.stringify(await historyRes.json(), null, 2), '\n');

  // 8. Test Rate Limiting
  console.log('8️⃣  Testing Rate Limiting (Calling 11 times)...');
  for (let i = 0; i < 11; i++) {
    const rateRes = await fetch('http://localhost:8080/api/insights/ask', {
      method: 'POST',
      headers,
      body: JSON.stringify({ question: `Rate limit test question ${i}` }),
    });
    const resData = await rateRes.json();
    if (!resData.success) {
      console.log(`❌ Call ${i+1} Failed as expected:`, resData.message);
      break;
    } else {
      console.log(`✅ Call ${i+1} Succeeded`);
    }
  }
}

testInsightsFlow().catch(console.error);
