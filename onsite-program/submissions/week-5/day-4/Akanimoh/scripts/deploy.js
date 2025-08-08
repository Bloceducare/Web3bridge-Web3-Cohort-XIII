const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const MultiSigWalletFactory = await hre.ethers.getContractFactory("MultiSigWalletFactory");
  const factory = await MultiSigWalletFactory.deploy();
  await factory.waitForDeployment(); // Replace .deployed() with waitForDeployment
  console.log("MultiSigWalletFactory deployed to:", await factory.getAddress());

  const owners = [
    deployer.address,
    "0x58C25c26666B31241C67Cf7B9a82e325eB07c342",
    "0x9e321066FF35d640Fb76310DCFB570ECE4865470",
    "0x43d9F129426b82759C0206BEcf400aAc024Bf5ED",
  ];

  const tx = await factory.createWallet(owners);
  const receipt = await tx.wait();
  const walletAddress = receipt.events.find(event => event.event === "MultiSigCreated")?.args.wallet; // Adjust event name based on your contract
  console.log("MultiSigWallet deployed to:", walletAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


// const hre = require("hardhat");

// async function main() {
//   const [deployer] = await hre.ethers.getSigners();
//   console.log("Deploying contracts with account:", deployer.address);

//   const MultiSigWalletFactory = await hre.ethers.getContractFactory("MultiSigWalletFactory");
//   const factory = await MultiSigWalletFactory.deploy();
//   await factory.deployed();
//   console.log("MultiSigWalletFactory deployed to:", factory.address);

//   const owners = [
//     deployer.address,
//     "0x58C25c26666B31241C67Cf7B9a82e325eB07c342",
//     "0x9e321066FF35d640Fb76310DCFB570ECE4865470",
//     "0x43d9F129426b82759C0206BEcf400aAc024Bf5ED",
//   ];

//   const tx = await factory.createWallet(owners);
//   const receipt = await tx.wait();
//   const walletAddress = receipt.events[0].args.wallet;
//   console.log("MultiSigWallet deployed to:", walletAddress);
// }

// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });