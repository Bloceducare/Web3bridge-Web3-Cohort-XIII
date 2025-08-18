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
    console.log("Successfully impersonated. Signer address:", impersonatedSigner.address);

    const ROUTER = await ethers.getContractAt("IUniswapV2Router02", UNIRouter);
    const DAI = await ethers.getContractAt("IERC20", DAIAddress);
    console.log("Connected to Uniswap V2 Router at:", UNIRouter);

    // Check initial balances
    const ethBalanceBefore = await impersonatedSigner.provider.getBalance(impersonatedSigner.address);
    const daiBalanceBefore = await DAI.balanceOf(impersonatedSigner.address);

    console.log("ETH Balance Before:", ethers.formatEther(ethBalanceBefore));
    console.log("DAI Balance Before:", ethers.formatUnits(daiBalanceBefore, 18));

    const amountOut = ethers.parseUnits("100", 18);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

    console.log("Preparing to swap ETH for DAI:");
    console.log("- Amount of DAI requested:", ethers.formatUnits(amountOut, 18));
    console.log("- Deadline for swap:", new Date(deadline * 1000).toLocaleString());
    console.log("- Path: [WETH -> DAI]");
    console.log("- ETH to be sent:", ethers.formatEther("1"));

    // Get the required ETH amount first or use a reasonable estimate
    let ethRequired: bigint;
    try {
      const amountsIn = await (ROUTER as any).getAmountsIn(amountOut, [wethAddress, DAIAddress]);
      ethRequired = amountsIn[0];
      console.log("ETH required for swap (calculated):", ethers.formatEther(ethRequired));
    } catch (error) {
      console.log("Could not calculate exact ETH required, using estimate...");
      // Use a reasonable estimate: 1 ETH should be more than enough for 100 DAI
      ethRequired = ethers.parseEther("1");
      console.log("ETH required for swap (estimated):", ethers.formatEther(ethRequired));
    }

    const tx = await (ROUTER as any).connect(impersonatedSigner).swapETHForExactTokens(
      amountOut,
      [wethAddress, DAIAddress],
      impersonatedSigner.address,
      deadline,
      { value: ethRequired }
    );

    console.log("Transaction sent! Waiting for confirmation...");
    await tx.wait();

    console.log("swapETHForExactTokens executed successfully!");
    console.log("Transaction Hash:", tx.hash);

    // Check final balances
    const ethBalanceAfter = await impersonatedSigner.provider.getBalance(impersonatedSigner.address);
    const daiBalanceAfter = await DAI.balanceOf(impersonatedSigner.address);

    console.log("ETH Balance After:", ethers.formatEther(ethBalanceAfter));
    console.log("DAI Balance After:", ethers.formatUnits(daiBalanceAfter, 18));
    console.log("ETH Used:", ethers.formatEther(ethBalanceBefore - ethBalanceAfter));
    console.log("DAI Received:", ethers.formatUnits(daiBalanceAfter - daiBalanceBefore, 18));

  } catch (error) {
    console.error("Error in swapETHForExactTokens script:", error);
    throw error;
  }
};

main().catch((error) => {
  console.error("Error executing script:", error);
  process.exitCode = 1;
});