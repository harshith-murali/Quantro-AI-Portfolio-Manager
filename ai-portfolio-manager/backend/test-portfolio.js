const fs = require('fs');

async function testPortfolioAPI() {
  console.log('🚀 Starting Portfolio API Test Sequence...\n');

  // 1. Register User
  console.log('1️⃣  Registering User...');
  const regRes = await fetch('http://localhost:8080/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Postman Tester',
      email: `test_${Date.now()}@quantro.dev`,
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

  // 2. Buy AAPL
  console.log('2️⃣  Buying 10 shares of AAPL @ $180.50...');
  const buy1 = await fetch('http://localhost:8080/api/trade/buy', {
    method: 'POST',
    headers,
    body: JSON.stringify({ symbol: 'AAPL', quantity: 10, price: 180.5 }),
  });
  console.log('Response:', JSON.stringify(await buy1.json(), null, 2), '\n');

  // 3. Buy AAPL again to test weighted average (5 shares @ $190.00)
  console.log('3️⃣  Buying 5 more shares of AAPL @ $190.00 (testing weighted average)...');
  const buy2 = await fetch('http://localhost:8080/api/trade/buy', {
    method: 'POST',
    headers,
    body: JSON.stringify({ symbol: 'AAPL', quantity: 5, price: 190.0 }),
  });
  console.log('Response:', JSON.stringify(await buy2.json(), null, 2), '\n');

  // 4. Buy NVDA
  console.log('4️⃣  Buying 2 shares of NVDA @ $850.00...');
  const buy3 = await fetch('http://localhost:8080/api/trade/buy', {
    method: 'POST',
    headers,
    body: JSON.stringify({ symbol: 'NVDA', quantity: 2, price: 850.0 }),
  });
  console.log('Response:', JSON.stringify(await buy3.json(), null, 2), '\n');

  // 5. Sell AAPL
  console.log('5️⃣  Selling 5 shares of AAPL @ $200.00 (testing realized P&L)...');
  const sell1 = await fetch('http://localhost:8080/api/trade/sell', {
    method: 'POST',
    headers,
    body: JSON.stringify({ symbol: 'AAPL', quantity: 5, price: 200.0 }),
  });
  console.log('Response:', JSON.stringify(await sell1.json(), null, 2), '\n');

  // 6. Get Holdings
  console.log('6️⃣  Fetching Current Holdings...');
  const holdings = await fetch('http://localhost:8080/api/holdings', { headers });
  console.log('Response:', JSON.stringify(await holdings.json(), null, 2), '\n');

  // 7. Get Portfolio Summary
  console.log('7️⃣  Fetching Portfolio Summary...');
  const summary = await fetch('http://localhost:8080/api/portfolio/summary', { headers });
  console.log('Response:', JSON.stringify(await summary.json(), null, 2), '\n');

  // 8. Error Case: Overselling
  console.log('8️⃣  Error Test: Trying to sell 100 shares of NVDA...');
  const overSell = await fetch('http://localhost:8080/api/trade/sell', {
    method: 'POST',
    headers,
    body: JSON.stringify({ symbol: 'NVDA', quantity: 100, price: 850.0 }),
  });
  console.log('Response:', JSON.stringify(await overSell.json(), null, 2), '\n');
}

testPortfolioAPI().catch(console.error);
