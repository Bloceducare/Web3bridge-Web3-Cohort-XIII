import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("Uniswap V2: Add Liquidity ETH\n");

  const AssetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [AssetHolder],
  });
  
  const impersonatedSigner = await ethers.getSigner(AssetHolder);

  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const Router = await ethers.getContractAt("IUniSwap", UNIRouter);

  const gasPrice = ethers.parseUnits("20", "gwei");

  const ethBal = await ethers.provider.getBalance(AssetHolder);
  const usdcBal = await USDC.balanceOf(AssetHolder);

  console.log("Initial Balances:");
  console.log("ETH Balance:", ethers.formatEther(ethBal.toString()));
  console.log("USDC Balance:", ethers.formatUnits(usdcBal.toString(), 6));
  console.log();

  const ethAmount = ethers.parseEther("1");
  const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const path = [WETHAddress, USDCAddress];

  const amountsOut = await Router.getAmountsOut(ethAmount, path);
  const expectedUSDC = amountsOut[1];
  const usdcAmount = expectedUSDC * 105n / 100n;

  console.log("Liquidity Details:");
  console.log("ETH Amount:", ethers.formatEther(ethAmount.toString()));
  console.log("Expected USDC for 1 ETH:", ethers.formatUnits(expectedUSDC.toString(), 6));
  console.log("USDC Amount to provide:", ethers.formatUnits(usdcAmount.toString(), 6));
  console.log();

  console.log("Approving USDC...");
  await USDC.connect(impersonatedSigner).approve(UNIRouter, usdcAmount, { gasPrice, gasLimit: 100000 });
  console.log("USDC approved");

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  console.log("Adding liquidity with ETH...");
  const provideLiquidity = await Router.connect(impersonatedSigner).addLiquidityETH(
    USDCAddress,
    usdcAmount,
    expectedUSDC * 95n / 100n,
    ethers.parseEther("0.95"),
    impersonatedSigner.address,
    deadline,
    {
      value: ethAmount,
      gasPrice,
      gasLimit: 300000
    }
  );

  const receipt = await provideLiquidity.wait();
  console.log("Liquidity added successfully!");
  console.log("Transaction hash:", receipt?.hash);
  console.log("Gas used:", receipt?.gasUsed.toString());
  console.log();

  const ethBalAfter = await ethers.provider.getBalance(AssetHolder);
  const usdcBalAfter = await USDC.balanceOf(AssetHolder);

  console.log("Final Balances:");
  console.log("ETH Balance:", ethers.formatEther(ethBalAfter.toString()));
  console.log("USDC Balance:", ethers.formatUnits(usdcBalAfter.toString(), 6));
  console.log();

  console.log("Assets Used:");
  console.log("ETH Used:", ethers.formatEther((ethBal - ethBalAfter).toString()));
  console.log("USDC Used:", ethers.formatUnits((usdcBal - usdcBalAfter).toString(), 6));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
