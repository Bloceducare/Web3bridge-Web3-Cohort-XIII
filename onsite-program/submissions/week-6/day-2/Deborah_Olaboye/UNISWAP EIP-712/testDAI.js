// testDAI.js
const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

  const DAI = new ethers.Contract(
    '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    ['function name() view returns (string)'],
    provider
  );

  const name = await DAI.name();
  console.log('DAI name:', name);
}

main().catch(console.error);
