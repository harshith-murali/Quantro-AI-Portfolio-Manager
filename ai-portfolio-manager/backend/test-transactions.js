const fs = require('fs');

async function testTransactionFlow() {
  console.log('🚀 Starting Transaction & Wallet Flow API Test...\n');

  // 1. Register User
  console.log('1️⃣  Registering Test User...');
  const regRes = await fetch('http://localhost:8080/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Ledger Master',
      email: `ledger_${Date.now()}@quantro.dev`,
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

  // 2. Get initial wallet balance
  console.log('2️⃣  Checking initial wallet balance (lazy creation)...');
  const getBal1 = await fetch('http://localhost:8080/api/wallet/balance', { headers });
  console.log('Response:', JSON.stringify(await getBal1.json(), null, 2), '\n');

  // 3. Try to buy stock without money (must fail)
  console.log('3️⃣  Attempting to BUY 10 shares of AAPL @ $180 without sufficient balance...');
  const failedBuy = await fetch('http://localhost:8080/api/trade/buy', {
    method: 'POST',
    headers,
    body: JSON.stringify({ symbol: 'AAPL', quantity: 10, price: 180.0 }),
  });
  console.log('Expected Error Response:', JSON.stringify(await failedBuy.json(), null, 2), '\n');

  // 4. Deposit $10,000 virtual cash
  console.log('4️⃣  Depositing $10,000 into virtual wallet...');
  const depRes = await fetch('http://localhost:8080/api/wallet/deposit', {
    method: 'POST',
    headers,
    body: JSON.stringify({ amount: 10000, description: 'Initial account funding' }),
  });
  console.log('Response:', JSON.stringify(await depRes.json(), null, 2), '\n');

  // 5. Buy 20 shares of MSFT @ $400 ($8000 debit)
  console.log('5️⃣  Successfully buying 20 shares of MSFT @ $400...');
  const buyRes = await fetch('http://localhost:8080/api/trade/buy', {
    method: 'POST',
    headers,
    body: JSON.stringify({ symbol: 'MSFT', quantity: 20, price: 400.0 }),
  });
  console.log('Response:', JSON.stringify(await buyRes.json(), null, 2), '\n');

  // 6. Check wallet balance after buy ($2,000 remaining)
  console.log('6️⃣  Verifying remaining wallet balance after buy...');
  const getBal2 = await fetch('http://localhost:8080/api/wallet/balance', { headers });
  console.log('Response:', JSON.stringify(await getBal2.json(), null, 2), '\n');

  // 7. Sell 10 shares of MSFT @ $450 ($4,500 credit + $500 P&L entry)
  console.log('7️⃣  Selling 10 shares of MSFT @ $450 (Profit capture)...');
  const sellRes = await fetch('http://localhost:8080/api/trade/sell', {
    method: 'POST',
    headers,
    body: JSON.stringify({ symbol: 'MSFT', quantity: 10, price: 450.0 }),
  });
  console.log('Response:', JSON.stringify(await sellRes.json(), null, 2), '\n');

  // 8. Check final balance ($2,000 + $4,500 = $6,500)
  console.log('8️⃣  Verifying new balance after sell execution...');
  const getBal3 = await fetch('http://localhost:8080/api/wallet/balance', { headers });
  console.log('Response:', JSON.stringify(await getBal3.json(), null, 2), '\n');

  // 9. Withdraw $1,500
  console.log('9️⃣  Withdrawing $1,500 cash from wallet...');
  const withdrawRes = await fetch('http://localhost:8080/api/wallet/withdraw', {
    method: 'POST',
    headers,
    body: JSON.stringify({ amount: 1500, description: 'Withdrawing partial funds' }),
  });
  console.log('Response:', JSON.stringify(await withdrawRes.json(), null, 2), '\n');

  // 10. Get Transactions list
  console.log('🔟  Listing all transactions in the ledger...');
  const transactionsRes = await fetch('http://localhost:8080/api/transactions', { headers });
  console.log('Response:', JSON.stringify(await transactionsRes.json(), null, 2), '\n');

  // 11. Get Transaction Summary
  console.log('📊  Fetching final wallet aggregates & transaction summary...');
  const summaryRes = await fetch('http://localhost:8080/api/transactions/summary', { headers });
  console.log('Response:', JSON.stringify(await summaryRes.json(), null, 2), '\n');
}

testTransactionFlow().catch(console.error);
