import { ethers } from "hardhat";

async function main() {
  const uniswapRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const PermitSwap = await ethers.getContractFactory("PermitSwap");
  const permitSwap = await PermitSwap.deploy(uniswapRouter);
  await permitSwap.waitForDeployment();
  console.log("PermitSwap deployed to:", await permitSwap.getAddress());

  const MockToken = await ethers.getContractFactory("MockToken");
  const mockToken = await MockToken.deploy();
  await mockToken.waitForDeployment();
  console.log("MockToken deployed to:", await mockToken.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});