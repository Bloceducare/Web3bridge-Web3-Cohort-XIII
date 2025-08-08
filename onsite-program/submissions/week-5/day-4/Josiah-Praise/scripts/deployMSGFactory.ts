import { ethers } from "hardhat";
import { MSWFactory } from "../typechain-types";

async function deploy() {
  const factory = await ethers.getContractFactory("MSWFactory");

  const instance = await factory.deploy();

  console.log("Contract deployed at ", await instance.getAddress());
}

deploy()
  .then(() => console.log("Deployment successful"))
  .catch(() => {
    console.error("Deployment failed");
    process.exit(1);
  });
