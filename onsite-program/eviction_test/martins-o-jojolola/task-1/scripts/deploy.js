const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Lottery contract...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const Lottery = await ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy();

  await lottery.deployed();

  console.log("Lottery contract deployed to:", lottery.address);
  console.log("Entry Fee:", ethers.utils.formatEther(await lottery.ENTRY_FEE()), "ETH");
  console.log("Max Players:", (await lottery.MAX_PLAYERS()).toString());
  
  return lottery.address;
}

if (require.main === module) {
  main()
    .then((address) => {
      console.log(`\nContract deployed successfully at: ${address}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };
