const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  const MockTokenA = await ethers.getContractFactory("MockTokenA");
  const mockTokenA = await MockTokenA.deploy();
  await mockTokenA.waitForDeployment();
  
  const tokenAAddress = await mockTokenA.getAddress();

  const lockPeriod = 7 * 24 * 60 * 60;
  
  const StakingContract = await ethers.getContractFactory("StakingContract");
  const stakingContract = await StakingContract.deploy(tokenAAddress, lockPeriod);
  await stakingContract.waitForDeployment();
  
  const stakingAddress = await stakingContract.getAddress();

  const [, rewardTokenAddress] = await stakingContract.getTokenAddresses();

  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    mockTokenA: tokenAAddress,
    stakingContract: stakingAddress,
    rewardToken: rewardTokenAddress,
    lockPeriod: lockPeriod,
    deploymentTime: new Date().toISOString()
  };

  const fs = require('fs');
  const path = require('path');
  
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const filename = `${hre.network.name}-deployment.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deploymentInfo, null, 2)
  );

  return {
    mockTokenA: tokenAAddress,
    stakingContract: stakingAddress,
    rewardToken: rewardTokenAddress
  };
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;