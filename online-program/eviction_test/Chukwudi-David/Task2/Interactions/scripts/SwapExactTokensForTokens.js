// scripts/swap.js
const { ethers } = require("hardhat");
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

async function main() {
  // Token addresses (Ethereum mainnet)
  const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

  // Uniswap V2 Router
  const UNISWAP_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  // DAI whale with large balance
  const WHALE = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  // Impersonate whale
  await helpers.impersonateAccount(WHALE);
  const signer = await ethers.getSigner(WHALE);

  // Contracts
  const DAIContract = await ethers.getContractAt("IERC20", DAI);
  const USDTContract = await ethers.getContractAt("IERC20", USDT);
  const Router = await ethers.getContractAt("IUniswap", UNISWAP_ROUTER);

  // Balances before
  let daiBalBefore = await DAIContract.balanceOf(WHALE);
  let usdtBalBefore = await USDTContract.balanceOf(WHALE);

  console.log("=== BALANCES BEFORE SWAP ===");
  console.log("DAI:", ethers.formatUnits(daiBalBefore, 18));
  console.log("USDT:", ethers.formatUnits(usdtBalBefore, 6));

  // Approve router to spend DAI
  const amountIn = ethers.parseUnits("100", 18); // swap 100 DAI
  const amountOutMin = 0;
  const deadline = (await helpers.time.latest()) + 600;

  console.log("\nApproving router...");
  await (await DAIContract.connect(signer).approve(UNISWAP_ROUTER, amountIn)).wait();
  console.log("Approval done ✅");

  // Perform swap DAI -> USDT
  console.log(`\nSwapping ${ethers.formatUnits(amountIn, 18)} DAI for USDT...`);
  const tx = await Router.connect(signer).swapExactTokensForTokens(
    amountIn,
    amountOutMin,
    [DAI, USDT],
    WHALE,
    deadline
  );
  const receipt = await tx.wait();
  console.log("Swap successful! Tx:", receipt.hash);

  // Balances after
  let daiBalAfter = await DAIContract.balanceOf(WHALE);
  let usdtBalAfter = await USDTContract.balanceOf(WHALE);

  console.log("\n=== BALANCES AFTER SWAP ===");
  console.log("DAI:", ethers.formatUnits(daiBalAfter, 18));
  console.log("USDT:", ethers.formatUnits(usdtBalAfter, 6));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
