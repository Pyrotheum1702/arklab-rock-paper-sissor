const https = require('https');

const data = JSON.stringify({
  network: 'base-sepolia',
  address: '0x356ed4C0220f5ace43F4ED61F01762c1e302F302',
  token: 'eth'
});

const options = {
  hostname: 'cloud-api.coinbase.com',
  port: 443,
  path: '/platform/projects/7dabe276-17ea-4f98-b4d4-20f062bf2d1a/v2/evm/faucet',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Accept': 'application/json'
  }
};

console.log('Requesting 0.05 ETH from Base Sepolia faucet...');
console.log('Address: 0x356ed4C0220f5ace43F4ED61F01762c1e302F302\n');

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('Status Code:', res.statusCode);

    try {
      const response = JSON.parse(responseData);
      console.log('Response:', JSON.stringify(response, null, 2));

      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('\nSuccess! Testnet ETH requested.');
        console.log('Wait 1-2 minutes for the transaction to confirm.');
        console.log('\nCheck balance with:');
        console.log('npx hardhat run check-balance.js --network baseSepolia');
      } else {
        console.log('\nFailed to request testnet ETH.');
        console.log('You may need to use the web interface at:');
        console.log('https://portal.cdp.coinbase.com/products/faucet');
      }
    } catch (e) {
      console.log('Raw Response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
  console.log('\nPlease use the web interface at:');
  console.log('https://portal.cdp.coinbase.com/products/faucet');
});

req.write(data);
req.end();
