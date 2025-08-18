import { ethers } from "hardhat";
import { impersonateAccount } from "@nomicfoundation/hardhat-toolbox/network-helpers";

const main = async () => {
  try {
    const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const USDCHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

    console.log("Impersonating account:", USDCHolder);
    await impersonateAccount(USDCHolder);
    const impersonatedSigner = await ethers.getSigner(USDCHolder);
    console.log("Successfully impersonated account");

    const DAI = await ethers.getContractAt("IERC20", DAIAddress);
    const ROUTER = await ethers.getContractAt("IUniswapV2Router02", UNIRouter);

    console.log("Getting Pair Address for Uniswap Router...");
    const factoryAddress = await ROUTER.factory();
    const factory = await ethers.getContractAt("IUniswapV2Factory", factoryAddress);

    const pairAddress = await factory.getPair(DAIAddress, wethAddress);
    console.log("LP Token Pair Address:", pairAddress);
    const LPToken = await ethers.getContractAt("IERC20", pairAddress);

    console.log("Getting Token Balance...");
    // Balance before removing liquidity
    const daiBalanceBefore = await DAI.balanceOf(impersonatedSigner.address);
    const ethBalanceBefore = await impersonatedSigner.provider.getBalance(impersonatedSigner.address);

    console.log("DAI Balance Before:", ethers.formatUnits(daiBalanceBefore, 18));
    console.log("ETH Balance Before:", ethers.formatUnits(ethBalanceBefore, 18));

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

    console.log("Removing Liquidity . . . . . .");
    const tx = await (ROUTER as any).connect(impersonatedSigner).removeLiquidityETH(
      DAIAddress,
      liquidityBF,
      0,
      0,
      impersonatedSigner.address,
      deadline
    );
    await tx.wait();

    console.log("removeLiquidityETH executed at:", tx.hash);

    // Balance after removing liquidity
    const daiBalanceAfter = await DAI.balanceOf(impersonatedSigner.address);
    const ethBalanceAfter = await impersonatedSigner.provider.getBalance(impersonatedSigner.address);

    console.log("DAI Balance After:", ethers.formatUnits(daiBalanceAfter, 18));
    console.log("ETH Balance After:", ethers.formatUnits(ethBalanceAfter, 18));

    const liquidityAF = await LPToken.balanceOf(impersonatedSigner.address);
    console.log("Liquidity Token Balance AF Burn:", liquidityAF);

  } catch (error) {
    console.error("Error in removeLiquidityETH script:", error);
    throw error;
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});