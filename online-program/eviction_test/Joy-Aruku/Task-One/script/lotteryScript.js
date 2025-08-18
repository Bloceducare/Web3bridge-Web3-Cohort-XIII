const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contracts with the account:', deployer.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());

  const Lottery = await ethers.getContractFactory('Lottery');
  const entryFee = ethers.utils.parseEther('0.1');
  const subscriptionId = 1; // Replace with your Chainlink subscription ID
  
  const lottery = await Lottery.deploy(
    entryFee,
    subscriptionId
  );
  await lottery.deployed();

  console.log('Lottery deployed to:', lottery.address);
  console.log('Entry fee set to:', entryFee.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });