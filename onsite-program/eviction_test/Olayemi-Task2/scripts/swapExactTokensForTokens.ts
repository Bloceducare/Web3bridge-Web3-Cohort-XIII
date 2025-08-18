import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const main = async () => {
  const DAIAddress = "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E ";
  const wethAddress = "0xdD2FD4581271e230360230F9337D5c0430Bf44C0";
  const UNIRouter = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";

  const USDCHolder = "00x1CBd3b2770909D4e10f157cABC84C7264073C9Ec";

  console.log("Impersonating account:", USDCHolder);
  await helpers.impersonateAccount(USDCHolder);
  const impersonatedSigner = await ethers.getSigner(USDCHolder);
  console.log("impersonated Signer address Successfully :", impersonatedSigner.address);

  const ROUTER = await ethers.getContractAt("IUniswapV2Router02", UNIRouter);
  console.log("Connected to Uniswap:", UNIRouter);

  const amountOut = ethers.parseUnits("100", 18);
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  console.log("Preparing to swap ETH for DAI:");
  console.log("- Amount of DAI requested:", ethers.formatUnits(amountOut, 18));
  console.log("- Deadline for swap:", new Date(deadline * 1000).toLocaleString());
  console.log("- Path: [WETH -> DAI]");
  console.log("- ETH to be sent:", ethers.formatEther("1"));

  const tx = await ROUTER.connect(impersonatedSigner).swapETHForExactTokens(
    amountOut,
    [wethAddress, DAIAddress],
    impersonatedSigner.address,
    deadline,
    { value: ethers.parseEther("1") }
  );

  console.log("Transaction sent..");
  await tx.wait();

  console.log( "executed successfully!");
  console.log("Transaction Hash:", tx.hash);
};

main().catch((error) => {
  console.error("Error executing script:", error);
  process.exitCode = 1;
});