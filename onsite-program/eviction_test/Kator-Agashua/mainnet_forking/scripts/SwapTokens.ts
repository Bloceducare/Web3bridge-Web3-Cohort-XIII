import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

async function main() {
  const assetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621"; // Asset holder address
  await helpers.impersonateAccount(assetHolder);
  const assetHolderSigner = await ethers.getSigner(assetHolder);
  const UNISWAP_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap V2 Router
  const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC
  const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // WETH
  const outputAmount = ethers.parseUnits("10000", 6); // Correct: 10,000 USDC

  const router = await ethers.getContractAt(
    "IUniswapV2Router02",
    UNISWAP_ROUTER
  );
  const path = [WETH_ADDRESS, USDC_ADDRESS]; // First is token you're spending, last is token you're receiving
  const amountsIn = await router.getAmountsIn(outputAmount, path);
  console.log(typeof amountsIn[0]);

  const requiredETH = ethers.formatEther(amountsIn[0]);
  console.log(`Amount of ETH needed for 10,000 USDC: ${requiredETH} ETH`);
  console.log(typeof requiredETH);
  

  const WETH = await ethers.getContractAt("IERC20", WETH_ADDRESS);
  const USDC = await ethers.getContractAt("IERC20", USDC_ADDRESS);

  // Approve the router to spend WETH
  const approval = await WETH.connect(assetHolderSigner).approve(
    router.target,
    amountsIn[0]
  );
  await approval.wait();

  console.log(`############# PRE Swap WETH Balance #############`);
  console.log(
    `WETH Balance: ${ethers.formatEther(
      await WETH.balanceOf(assetHolder)
    )} WETH`
  );
  console.log(
    `USDC Balance: ${ethers.formatUnits(
      await USDC.balanceOf(assetHolder),
      6
    )} USDC`
  );

  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now
  const tx = await router
    .connect(assetHolderSigner)
    .swapTokensForExactTokens(
      outputAmount,
      amountsIn[0],
      path,
      assetHolder,
      deadline
    );

  await tx.wait();

  console.log(`############## POST Swap Balances #############`);
  console.log(
    `WETH Balance: ${ethers.formatEther(
      await WETH.balanceOf(assetHolder)
    )} WETH`
  );
  console.log(
    `USDC Balance: ${ethers.formatUnits(
      await USDC.balanceOf(assetHolder),
      6
    )} USDC`
  );

  console.log(`Swap completed!`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
