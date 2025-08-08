import { ethers } from "hardhat";
import { MultiSigWallet } from "../typechain-types";

async function deploy() {
  const factory = await ethers.getContractFactory("MultiSigWallet");

  const [me] = await ethers.getSigners();

  const instance = await factory.deploy(
   [
      me.address,
      "0x9ad6b669EB355D4924eCa26ddF0636F4897aEF22",
      "0x471DeA1A0D50e83dc85e97Ba3a6eeA5BC1655e80"  
    ],
    2
  );

  await instance.waitForDeployment(); // Good practice
  console.log("Contract deployed at:", await instance.getAddress());
}

deploy()
  .then(() => console.log("Deployment successful"))
  .catch((error) => {
    // ✅ Add error parameter
    console.error("Deployment failed:", error);
    process.exit(1);
  });
