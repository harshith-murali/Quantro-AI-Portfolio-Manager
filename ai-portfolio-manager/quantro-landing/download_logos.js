const fs = require('fs');
const path = require('path');
const https = require('https');

const DOMAINS = {
  "RELIANCE": "ril.com",
  "TCS": "tcs.com",
  "HDFCBANK": "hdfcbank.com",
  "ICICIBANK": "icicibank.com",
  "BHARTIARTL": "airtel.in",
  "SBIN": "sbi.co.in",
  "INFY": "infosys.com",
  "LICI": "licindia.in",
  "ITC": "itcportal.com",
  "HINDUNILVR": "hul.co.in",
  "LT": "larsentoubro.com",
  "AXISBANK": "axisbank.com",
  "KOTAKBANK": "kotak.com",
  "SUNPHARMA": "sunpharma.com",
  "BAJFINANCE": "bajajfinserv.in",
  "MARUTI": "marutisuzuki.com",
  "TITAN": "titancompany.in",
  "ADANIENT": "adanienterprises.com",
  "NTPC": "ntpc.co.in",
  "ULTRACEMCO": "ultratechcement.com",
  "ASIANPAINT": "asianpaints.com",
  "COALINDIA": "coalindia.in",
  "TATAMOTORS": "tatamotors.com",
  "ONGC": "ongcindia.com",
  "BAJAJFINSV": "bajajfinserv.in",
  "JSWSTEEL": "jsw.in",
  "NESTLEIND": "nestle.in",
  "MM": "mahindra.com",
  "GRASIM": "grasim.com",
  "HINDALCO": "hindalco.com",
  "TECHM": "techmahindra.com",
  "ADANIPORTS": "adaniports.com",
  "TATASTEEL": "tatasteel.com",
  "SBILIFE": "sbilife.co.in",
  "BPCL": "bharatpetroleum.in",
  "DRREDDY": "drreddys.com",
  "CIPLA": "cipla.com",
  "APOLLOHOSP": "apollohospitals.com",
  "BRITANNIA": "britannia.co.in",
  "EICHERMOT": "eichermotors.com",
  "INDUSINDBK": "indusind.com",
  "HEROMOTOCO": "heromotocorp.com",
  "DIVISLAB": "divislabs.com",
  "BAJAJ-AUTO": "bajajauto.com",
  "TATACONSUM": "tataconsumer.com",
  "HDFCLIFE": "hdfclife.com",
  "SHRIRAMFIN": "shriramfinance.in",
  "WIPRO": "wipro.com",
  "HCLTECH": "hcltech.com"
};

const LOGO_DIR = path.join(__dirname, 'public', 'logos');
if (!fs.existsSync(LOGO_DIR)) {
  fs.mkdirSync(LOGO_DIR, { recursive: true });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const file = fs.createWriteStream(dest);
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        download(response.headers.location, dest).then(resolve).catch(reject);
      } else {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function run() {
  for (const [symbol, domain] of Object.entries(DOMAINS)) {
    const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    const dest = path.join(LOGO_DIR, `${symbol}.png`);
    try {
      console.log(`Downloading ${symbol}...`);
      await download(url, dest);
      console.log(`Success: ${symbol}`);
    } catch (e) {
      console.log(`Failed: ${symbol} - ${e.message}`);
    }
    // sleep
    await new Promise(r => setTimeout(r, 200));
  }
}

run();
