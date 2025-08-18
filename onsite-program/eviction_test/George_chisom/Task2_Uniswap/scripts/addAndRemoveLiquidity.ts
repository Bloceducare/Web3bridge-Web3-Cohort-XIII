import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("Uniswap V2: Add and Remove Liquidity Demo\n");

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
  const UNIFactory = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

  // Get contract instances
  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const DAI = await ethers.getContractAt("IERC20", DAIAddress);
  const Router = await ethers.getContractAt("IUniSwap", UNIRouter);
  const Factory = await ethers.getContractAt("IUniswapV2Factory", UNIFactory);

  // Gas settings
  const gasPrice = ethers.parseUnits("20", "gwei");

  // Check initial balances
  const usdcBal = await USDC.balanceOf(AssetHolder);
  const daiBal = await DAI.balanceOf(AssetHolder);

  console.log("STEP 1: ADD LIQUIDITY");
  console.log("Initial Balance Info:");
  console.log("USDC Balance:", ethers.formatUnits(usdcBal.toString(), 6));
  console.log("DAI Balance:", ethers.formatUnits(daiBal.toString(), 18));
  console.log();

  // Define amounts
  const USDCAmount = ethers.parseUnits("1000", 6);
  const DAIAmount = ethers.parseUnits("1000", 18);

  // Approve tokens
  console.log("Approving tokens...");
  const approvalUSDC = await USDC.connect(impersonatedSigner).approve(
    UNIRouter,
    USDCAmount,
    { gasPrice, gasLimit: 100000 }
  );
  await approvalUSDC.wait();
  console.log("USDC approved");

  const approvalDAI = await DAI.connect(impersonatedSigner).approve(
    UNIRouter,
    DAIAmount,
    { gasPrice, gasLimit: 100000 }
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

  const receipt1 = await provideLiquidity.wait();
  console.log("Liquidity added successfully!");
  console.log("Transaction hash:", receipt1?.hash);
  console.log("Gas used:", receipt1?.gasUsed.toString());
  console.log();

  // Check balances after adding liquidity
  const usdcBalAfterAdd = await USDC.balanceOf(AssetHolder);
  const daiBalAfterAdd = await DAI.balanceOf(AssetHolder);

  console.log("Balances After Adding Liquidity:");
  console.log(
    "USDC Balance:",
    ethers.formatUnits(usdcBalAfterAdd.toString(), 6)
  );
  console.log(
    "DAI Balance:",
    ethers.formatUnits(daiBalAfterAdd.toString(), 18)
  );
  console.log(
    "USDC Used:",
    ethers.formatUnits((usdcBal - usdcBalAfterAdd).toString(), 6)
  );
  console.log(
    "DAI Used:",
    ethers.formatUnits((daiBal - daiBalAfterAdd).toString(), 18)
  );
  console.log();

  // Get pair address and check LP tokens
  const pairAddress = await Factory.getPair(USDCAddress, DAIAddress);
  const Pair = await ethers.getContractAt("IUniswapV2Pair", pairAddress);

  console.log("STEP 2: CHECK LP TOKENS");
  console.log("Pair address:", pairAddress);

  const lpBalance = await Pair.balanceOf(AssetHolder);
  console.log("LP Token Balance:", ethers.formatEther(lpBalance.toString()));
  console.log();

  if (lpBalance === 0n) {
    console.log(
      "No LP tokens found. Something went wrong with liquidity addition."
    );
    return;
  }

  // Remove 50% of liquidity
  console.log("STEP 3: REMOVE LIQUIDITY");
  const liquidityToRemove = lpBalance / 2n;
  console.log(
    "Removing liquidity:",
    ethers.formatEther(liquidityToRemove.toString())
  );

  // Approve LP tokens
  const approvalLP = await Pair.connect(impersonatedSigner).approve(
    UNIRouter,
    liquidityToRemove,
    { gasPrice, gasLimit: 100000 }
  );
  await approvalLP.wait();
  console.log("LP tokens approved");

  // Remove liquidity
  console.log("Removing liquidity...");
  const removeLiquidity = await Router.connect(
    impersonatedSigner
  ).removeLiquidity(
    USDCAddress,
    DAIAddress,
    liquidityToRemove,
    1, // Minimum USDC
    1, // Minimum DAI
    impersonatedSigner.address,
    deadline,
    { gasPrice, gasLimit: 300000 }
  );

  const receipt2 = await removeLiquidity.wait();
  console.log("Liquidity removed successfully!");
  console.log("Transaction hash:", receipt2?.hash);
  console.log("Gas used:", receipt2?.gasUsed.toString());
  console.log();

  // Check final balances
  const usdcBalFinal = await USDC.balanceOf(AssetHolder);
  const daiBalFinal = await DAI.balanceOf(AssetHolder);
  const lpBalanceFinal = await Pair.balanceOf(AssetHolder);

  console.log("=== FINAL RESULTS ===");
  console.log("Final Token Balances:");
  console.log("USDC Balance:", ethers.formatUnits(usdcBalFinal.toString(), 6));
  console.log("DAI Balance:", ethers.formatUnits(daiBalFinal.toString(), 18));
  console.log(
    "LP Token Balance:",
    ethers.formatEther(lpBalanceFinal.toString())
  );
  console.log();

  console.log("Tokens Received from Removing Liquidity:");
  console.log(
    "USDC Received:",
    ethers.formatUnits((usdcBalFinal - usdcBalAfterAdd).toString(), 6)
  );
  console.log(
    "DAI Received:",
    ethers.formatUnits((daiBalFinal - daiBalAfterAdd).toString(), 18)
  );
  console.log();

  console.log("Net Change from Initial:");
  console.log(
    "USDC Net Change:",
    ethers.formatUnits((usdcBalFinal - usdcBal).toString(), 6)
  );
  console.log(
    "DAI Net Change:",
    ethers.formatUnits((daiBalFinal - daiBal).toString(), 18)
  );
  console.log();

  console.log("Add and Remove Liquidity Demo Completed Successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
