const { ethers, upgrades, run } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  
  // Deploy RoleRegistry
  const RoleRegistry = await ethers.getContractFactory("RoleRegistry");
  const roleRegistry = await RoleRegistry.deploy();
  await roleRegistry.waitForDeployment();
  
  console.log("RoleRegistry deployed to:", await roleRegistry.getAddress());
  
  // Try to verify (may not work until Lisk supports verification)
  try {
    await run("verify:verify", {
      address: await roleRegistry.getAddress(),
      constructorArguments: [],
    });
  } catch (e) {
    console.log("Verification failed (might not be supported yet):", e.message);
  }
  
  // Deploy NFTRoleDAO
  const NFTRoleDAO = await ethers.getContractFactory("NFTRoleDAO");
  const dao = await upgrades.deployProxy(NFTRoleDAO, [await roleRegistry.getAddress()], {
    initializer: "initialize",
  });
  await dao.waitForDeployment();
  
  console.log("NFTRoleDAO deployed to:", await dao.getAddress());
  
  // Transfer ownership if needed
  // await dao.transferOwnership("0xNewOwnerAddress");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });