import { ethers } from "hardhat";

const UNISWAP_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap V2 Router
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // WETH
const assetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621"; // Asset holder address

const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const SLIPPAGE = 1; // 1%

async function main() {
  // Impersonate the asset holder account
  await helpers.impersonateAccount(assetHolder);
  const deployer = await ethers.getSigner(assetHolder);
  const router = await ethers.getContractAt(
    "IUniswapV2Router02",
    UNISWAP_ROUTER
  );
  const WETH = await ethers.getContractAt("IERC20", WETH_ADDRESS);
  const USDC = await ethers.getContractAt("IERC20", USDC_ADDRESS);

  const amountTokenDesired = ethers.parseUnits("1000", 6); // 1000 USDC

  // Estimate ETH needed for 1000 USDC
  const path = [USDC, WETH_ADDRESS];
  const amountsOut = await router.getAmountsOut(amountTokenDesired, path);
  const amountETHExpected = amountsOut[1];

  // Apply slippage
  const amountTokenMin =
    (amountTokenDesired * BigInt(100 - SLIPPAGE)) / BigInt(100);
  const amountETHMin =
    (amountETHExpected * BigInt(100 - SLIPPAGE)) / BigInt(100);

  
  console.log(
    `amountTokenDesired: ${ethers.formatUnits(amountTokenDesired, 6)} USDC`
  );
  console.log(
    `amountTokenMin:     ${ethers.formatUnits(amountTokenMin, 6)} USDC`
  );
  console.log(`amountETHMin:       ${ethers.formatEther(amountETHMin)} ETH`);
  console.log(
    `Deployer ETH balance: ${ethers.formatEther(
      await WETH.connect(deployer).balanceOf(WETH_ADDRESS)
    )} ETH`
  );

  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

  // Approve the router to spend USDC
  const approveUSDC = await USDC.connect(deployer).approve(
    UNISWAP_ROUTER,
    amountTokenDesired
  );
  await approveUSDC.wait();

  const tx = await router
    .connect(deployer)
    .addLiquidityETH(
      USDC_ADDRESS,
      amountTokenDesired,
      amountTokenMin,
      amountETHMin,
      deployer.address,
      deadline,
      {
        value: amountETHExpected,
      }
    );
  await tx.wait();

  console.log(
  `Deployer ETH balance POST LIQUIDITY: ${ethers.formatEther(
      await ethers.provider.getBalance(deployer.address)
    )} ETH`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
