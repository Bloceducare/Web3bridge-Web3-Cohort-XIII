const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy PiggyBank (ETH version in this example)
  const PiggyBank = await ethers.getContractFactory("PiggyBank");
  const piggyBank = await PiggyBank.deploy(
    deployer.address,       // _owner
    ethers.ZeroAddress,     // _token (ETH piggy bank)
    60 * 60 * 24,            // 1-day lock
    deployer.address        // _factoryAdmin (just for example)
  );

  await piggyBank.waitForDeployment();
  console.log("PiggyBank deployed to:", piggyBank.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
