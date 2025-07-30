import { ethers } from 'hardhat';

async function main() {
  const sms = await ethers.deployContract('SchoolManagement');

  await sms.waitForDeployment();

  console.log('NFT Contract Deployed at ' + sms.target);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});