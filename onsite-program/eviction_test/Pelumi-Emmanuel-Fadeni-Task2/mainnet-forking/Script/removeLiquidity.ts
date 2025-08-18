import { ethers } from "hardhat";
import { impersonateAccount } from "@nomicfoundation/hardhat-toolbox/network-helpers";


const main = async () => {
  try {
    const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

    const USDCHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

    console.log("Impersonating account:", USDCHolder);
    await impersonateAccount(USDCHolder);
    const impersonatedSigner = await ethers.getSigner(USDCHolder);
    console.log("Successfully impersonated account");

  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const DAI = await ethers.getContractAt("IERC20", DAIAddress);

  // Get the router contract with proper typing
  const ROUTER = await ethers.getContractAt("IUniswapV2Router02", UNIRouter);

  console.log("Getting Pair Address for Uniswap Router...");
  const factoryAddress = await ROUTER.factory();
  const factory = await ethers.getContractAt("IUniswapV2Factory", factoryAddress);

  const pairAddress = await factory.getPair(USDCAddress, DAIAddress);
  console.log("LP Token Pair Address:", pairAddress);

  // Get the LP token contract with proper IERC20 interface
  const LPToken = await ethers.getContractAt("IERC20", pairAddress);

  // Check Balances Before Adding Liquidity
  const usdcBalBefore = await USDC.balanceOf(impersonatedSigner.address);
  const daiBalBefore = await DAI.balanceOf(impersonatedSigner.address);

  console.log("USDC Balance Before:", ethers.formatUnits(usdcBalBefore, 6));
  console.log("DAI Balance Before:", ethers.formatUnits(daiBalBefore, 18));

    const liquidityBF = await LPToken.balanceOf(impersonatedSigner.address);
    console.log("Liquidity Token Balance BF Burn:", liquidityBF);

    // Check if user has any LP tokens
    if (liquidityBF === 0n) {
      console.log("No LP tokens to remove. Exiting...");
      return;
    }

    console.log("Approving LP tokens to be burnt");
    const approveTx = await (LPToken as any).connect(impersonatedSigner).approve(UNIRouter, liquidityBF);
    await approveTx.wait();
    console.log("LP tokens approved for removal");

    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

    console.log("Removing Liquidity . . . .");
    const tx = await (ROUTER as any).connect(impersonatedSigner).removeLiquidity(
      USDCAddress,
      DAIAddress,
      liquidityBF,
      0,
      0,
      impersonatedSigner.address,
      deadline
    );
    await tx.wait();

    console.log("removeLiquidity executed at:", tx.hash);

    // Check Balances After Removing Liquidity
    const usdcBalAfter = await USDC.balanceOf(impersonatedSigner.address);
    const daiBalAfter = await DAI.balanceOf(impersonatedSigner.address);

    console.log("USDC Balance After:", ethers.formatUnits(usdcBalAfter, 6));
    console.log("DAI Balance After:", ethers.formatUnits(daiBalAfter, 18));

    const liquidityAF = await LPToken.balanceOf(impersonatedSigner.address);
    console.log("Liquidity Token Balance AF Burn:", liquidityAF);

  } catch (error) {
    console.error("Error in removeLiquidity script:", error);
    throw error;
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});