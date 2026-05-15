const fs = require('fs');

async function testNiftyRestriction() {
  console.log('🚀 Testing Nifty 50 Stock Restriction validation...\n');

  // 1. Register or reuse user (lets just register a new quick one)
  const regRes = await fetch('http://localhost:8080/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Nifty Trader',
      email: `nifty_${Date.now()}@fintech.dev`,
      password: 'Password123!',
    }),
  });
  const regData = await regRes.json();
  const token = regData.data.accessToken;

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Deposit funds first
  await fetch('http://localhost:8080/api/wallet/deposit', {
    method: 'POST',
    headers,
    body: JSON.stringify({ amount: 50000.00, description: 'Nifty funding' }),
  });

  // 2. Attempt to buy NVDA (Not Nifty 50, must fail now)
  console.log('❌ Testing Invalid Ticker: Attempting to BUY NVDA (Non-Nifty)...');
  const buyNVDA = await fetch('http://localhost:8080/api/trade/buy', {
    method: 'POST',
    headers,
    body: JSON.stringify({ symbol: 'NVDA', quantity: 2, price: 900.00 }),
  });
  console.log('Response:', JSON.stringify(await buyNVDA.json(), null, 2), '\n');

  // 3. Attempt to buy RELIANCE (Valid Nifty 50, must succeed)
  console.log('✅ Testing Valid Ticker: Attempting to BUY RELIANCE (Nifty 50 component)...');
  const buyReliance = await fetch('http://localhost:8080/api/trade/buy', {
    method: 'POST',
    headers,
    body: JSON.stringify({ symbol: 'RELIANCE', quantity: 10, price: 2950.00 }),
  });
  console.log('Response:', JSON.stringify(await buyReliance.json(), null, 2), '\n');

  // 4. Attempt to buy TCS (Valid Nifty 50, must succeed)
  console.log('✅ Testing Valid Ticker: Attempting to BUY TCS (Nifty 50 component)...');
  const buyTcs = await fetch('http://localhost:8080/api/trade/buy', {
    method: 'POST',
    headers,
    body: JSON.stringify({ symbol: 'tcs', quantity: 5, price: 3800.00 }), // Testing lowercase mapping as well
  });
  console.log('Response:', JSON.stringify(await buyTcs.json(), null, 2), '\n');
}

testNiftyRestriction().catch(console.error);
