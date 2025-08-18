import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  console.log("UNISWAP V2 - REMOVE LIQUIDITY ETH");

  const AssetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await helpers.impersonateAccount(AssetHolder);
  const impersonatedSigner = await ethers.getSigner(AssetHolder);

  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const FactoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const Router = await ethers.getContractAt("IUniSwap", UNIRouter);

  console.log("Step 1: Adding ETH liquidity to have LP tokens to remove");

  const ethAmount = ethers.parseEther("1.0");
  const usdcAmount = ethers.parseUnits("2500", 6);

  await USDC.connect(impersonatedSigner).approve(UNIRouter, usdcAmount);

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  const addLiquidityTx = await Router.connect(impersonatedSigner).addLiquidityETH(
    USDCAddress,
    usdcAmount,
    1,
    1,
    impersonatedSigner.address,
    deadline,
    { value: ethAmount }
  );
  await addLiquidityTx.wait();
  console.log("ETH Liquidity added successfully");

  const Factory = await ethers.getContractAt("IUniswapV2Factory", FactoryAddress);
  const pairAddress = await Factory.getPair(USDCAddress, WETHAddress);
  const LPToken = await ethers.getContractAt("IERC20", pairAddress);

  const lpBalance = await LPToken.balanceOf(AssetHolder);
  console.log(`LP Token Balance: ${ethers.formatEther(lpBalance)}`);

  console.log("Step 2: Removing ETH liquidity");

  const ethBalBefore = await ethers.provider.getBalance(AssetHolder);
  const usdcBalBefore = await USDC.balanceOf(AssetHolder);

  console.log("INITIAL BALANCES:");
  console.log(`ETH Balance: ${ethers.formatEther(ethBalBefore)}`);
  console.log(`USDC Balance: ${ethers.formatUnits(usdcBalBefore, 6)}`);
  console.log(`LP Token Balance: ${ethers.formatEther(lpBalance)}`);

  const liquidityToRemove = lpBalance / 2n;
  console.log(`Removing ${ethers.formatEther(liquidityToRemove)} LP tokens`);

  await LPToken.connect(impersonatedSigner).approve(UNIRouter, liquidityToRemove);

  const removeLiquidityTx = await Router.connect(impersonatedSigner).removeLiquidityETH(
    USDCAddress,
    liquidityToRemove,
    1,
    1,
    impersonatedSigner.address,
    deadline
  );

  const receipt = await removeLiquidityTx.wait();
  console.log("ETH Liquidity removed");
  console.log(`Transaction Hash: ${receipt?.hash}`);
  console.log(`Gas Used: ${receipt?.gasUsed.toString()}`);

  const ethBalAfter = await ethers.provider.getBalance(AssetHolder);
  const usdcBalAfter = await USDC.balanceOf(AssetHolder);
  const lpBalAfter = await LPToken.balanceOf(AssetHolder);

  console.log("FINAL BALANCES:");
  console.log(`ETH Balance: ${ethers.formatEther(ethBalAfter)}`);
  console.log(`USDC Balance: ${ethers.formatUnits(usdcBalAfter, 6)}`);
  console.log(`LP Token Balance: ${ethers.formatEther(lpBalAfter)}`);

  console.log("CHANGES:");
  console.log(`ETH Change: ${ethers.formatEther(ethBalAfter - ethBalBefore)}`);
  console.log(`USDC Change: ${ethers.formatUnits(usdcBalAfter - usdcBalBefore, 6)}`);
  console.log(`LP Token Change: ${ethers.formatEther(lpBalAfter - lpBalance)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
