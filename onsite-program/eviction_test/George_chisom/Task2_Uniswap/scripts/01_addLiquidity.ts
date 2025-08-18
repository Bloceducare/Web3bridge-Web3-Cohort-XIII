import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("Uniswap V2: Add Liquidity\n");

  // Asset holder with significant token balances
  const AssetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [AssetHolder],
  });

  const impersonatedSigner = await ethers.getSigner(AssetHolder);

  // Token addresses
  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  // Get contract instances
  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const DAI = await ethers.getContractAt("IERC20", DAIAddress);
  const Router = await ethers.getContractAt("IUniSwap", UNIRouter);

  // Check initial balances
  const usdcBal = await USDC.balanceOf(AssetHolder);
  const daiBal = await DAI.balanceOf(AssetHolder);

  console.log("Initial Balance Info:");
  console.log("USDC Balance:", ethers.formatUnits(usdcBal.toString(), 6));
  console.log("DAI Balance:", ethers.formatUnits(daiBal.toString(), 18));
  console.log();

  // Define amounts
  const USDCAmount = ethers.parseUnits("1000", 6);
  const DAIAmount = ethers.parseUnits("1000", 18);

  // Approve tokens with manual gas settings
  console.log("Approving tokens...");
  const gasPrice = ethers.parseUnits("20", "gwei");
  const gasLimit = 100000;

  const approvalUSDC = await USDC.connect(impersonatedSigner).approve(
    UNIRouter,
    USDCAmount,
    { gasPrice, gasLimit }
  );
  await approvalUSDC.wait();
  console.log("USDC approved");

  const approvalDAI = await DAI.connect(impersonatedSigner).approve(
    UNIRouter,
    DAIAmount,
    { gasPrice, gasLimit }
  );
  await approvalDAI.wait();
  console.log("DAI approved");
  console.log();

  // Add liquidity
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  console.log("Adding liquidity...");
  const provideLiquidity = await Router.connect(
    impersonatedSigner
  ).addLiquidity(
    USDCAddress,
    DAIAddress,
    USDCAmount,
    DAIAmount,
    ethers.parseUnits("950", 6), // 5% slippage
    ethers.parseUnits("950", 18), // 5% slippage
    impersonatedSigner.address,
    deadline,
    { gasPrice, gasLimit: 300000 }
  );

  const receipt = await provideLiquidity.wait();
  console.log("Liquidity added successfully!");
  console.log("Transaction hash:", receipt?.hash);
  console.log("Gas used:", receipt?.gasUsed.toString());
  console.log();

  // Check final balances
  const usdcBalAfter = await USDC.balanceOf(AssetHolder);
  const daiBalAfter = await DAI.balanceOf(AssetHolder);

  console.log("Final Balance Info:");
  console.log("USDC Balance:", ethers.formatUnits(usdcBalAfter.toString(), 6));
  console.log("DAI Balance:", ethers.formatUnits(daiBalAfter.toString(), 18));
  console.log();

  console.log(
    "USDC Used:",
    ethers.formatUnits((usdcBal - usdcBalAfter).toString(), 6)
  );
  console.log(
    "DAI Used:",
    ethers.formatUnits((daiBal - daiBalAfter).toString(), 18)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
