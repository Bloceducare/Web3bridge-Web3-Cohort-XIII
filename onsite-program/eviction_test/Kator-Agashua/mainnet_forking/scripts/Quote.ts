import { ethers } from "hardhat";

const UNISWAP_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap V2 Router
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const USDC_WETH_PAIR = "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc"; // Uniswap V2 USDC/WETH pair address

async function main() {
  const amountUSDC = ethers.parseUnits("1000", 6); // 1000 USDC

  // Get contract instances
  const pair = await ethers.getContractAt("IUniswapV2Pair", USDC_WETH_PAIR);
  const router = await ethers.getContractAt("IUniswapV2Router02", UNISWAP_ROUTER);

  // Fetch reserves
  const [reserve0, reserve1] = await pair.getReserves();
  const token0 = await pair.token0();
  const token1 = await pair.token1();

  console.log(`Token0: ${token0}`);
  console.log(`Token1: ${token1}`);
  console.log(`Reserve0: ${reserve0.toString()}`);
  console.log(`Reserve1: ${reserve1.toString()}`);

  let reserveUSDC, reserveWETH;
  if (token0.toLowerCase() === USDC.toLowerCase()) {
    reserveUSDC = reserve0;
    reserveWETH = reserve1;
    console.log("USDC is token0");
  } else {
    reserveUSDC = reserve1;
    reserveWETH = reserve0;
    console.log("USDC is token1");
  }

  console.log(`USDC Reserve: ${ethers.formatUnits(reserveUSDC, 6)} USDC`);
  console.log(`WETH Reserve: ${ethers.formatEther(reserveWETH)} WETH`);

  // Calculate current price (USDC per ETH)
  const priceUSDCPerETH = (reserveUSDC * ethers.parseEther("1")) / reserveWETH;
  console.log(`Current Price: ${ethers.formatUnits(priceUSDCPerETH, 6)} USDC per ETH`);

  // Call quote - this gives you how much WETH you'd get for selling USDC
  const amountWETH = await router.quote(amountUSDC, reserveUSDC, reserveWETH);

 
  console.log(`Input: ${ethers.formatUnits(amountUSDC, 6)} USDC`);
  console.log(`Output: ${ethers.formatEther(amountWETH)} WETH`);
  
  // Calculate the effective price from this quote
  const effectivePrice = (amountUSDC * ethers.parseEther("1")) / amountWETH;
  console.log(`Effective Price: ${ethers.formatUnits(effectivePrice, 6)} USDC per WETH`);

  // Alternative: Use getAmountsOut for a more realistic quote (includes fees)
  const path = [USDC, WETH];
  const amountsOut = await router.getAmountsOut(amountUSDC, path);
  console.log(`Input: ${ethers.formatUnits(amountsOut[0], 6)} USDC`);
  console.log(`Output: ${ethers.formatEther(amountsOut[1])} WETH`);
  
  const effectivePriceWithFees = (amountsOut[0] * ethers.parseEther("1")) / amountsOut[1];
  console.log(`Effective Price (with fees): ${ethers.formatUnits(effectivePriceWithFees, 6)} USDC per WETH`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});