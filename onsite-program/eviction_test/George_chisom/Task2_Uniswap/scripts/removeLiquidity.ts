import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("Uniswap V2: Add Liquidity then Remove Liquidity\n");

  const AssetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [AssetHolder],
  });

  const impersonatedSigner = await ethers.getSigner(AssetHolder);

  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const UNIFactory = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const DAI = await ethers.getContractAt("IERC20", DAIAddress);
  const Router = await ethers.getContractAt("IUniSwap", UNIRouter);
  const Factory = await ethers.getContractAt("IUniswapV2Factory", UNIFactory);

  const gasPrice = ethers.parseUnits("20", "gwei");

  // STEP 1: ADD LIQUIDITY FIRST
  console.log("=== STEP 1: ADDING LIQUIDITY ===");

  const usdcBal = await USDC.balanceOf(AssetHolder);
  const daiBal = await DAI.balanceOf(AssetHolder);

  console.log("Initial Balances:");
  console.log("USDC Balance:", ethers.formatUnits(usdcBal.toString(), 6));
  console.log("DAI Balance:", ethers.formatUnits(daiBal.toString(), 18));
  console.log();

  const USDCAmount = ethers.parseUnits("1000", 6);
  const DAIAmount = ethers.parseUnits("1000", 18);

  console.log("Approving tokens for liquidity...");
  await USDC.connect(impersonatedSigner).approve(UNIRouter, USDCAmount, {
    gasPrice,
    gasLimit: 100000,
  });
  await DAI.connect(impersonatedSigner).approve(UNIRouter, DAIAmount, {
    gasPrice,
    gasLimit: 100000,
  });
  console.log("Tokens approved");

  let deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  console.log("Adding liquidity...");
  const provideLiquidity = await Router.connect(
    impersonatedSigner
  ).addLiquidity(
    USDCAddress,
    DAIAddress,
    USDCAmount,
    DAIAmount,
    ethers.parseUnits("950", 6),
    ethers.parseUnits("950", 18),
    impersonatedSigner.address,
    deadline,
    { gasPrice, gasLimit: 300000 }
  );

  const addReceipt = await provideLiquidity.wait();
  console.log("Liquidity added successfully!");
  console.log("Transaction hash:", addReceipt?.hash);
  console.log("Gas used:", addReceipt?.gasUsed.toString());
  console.log();

  // STEP 2: REMOVE LIQUIDITY
  console.log("=== STEP 2: REMOVING LIQUIDITY ===");

  const pairAddress = await Factory.getPair(USDCAddress, DAIAddress);
  console.log("Pair Address:", pairAddress);

  const Pair = await ethers.getContractAt("IERC20", pairAddress);
  const liquidityBalance = await Pair.balanceOf(AssetHolder);

  console.log(
    "LP Token Balance:",
    ethers.formatUnits(liquidityBalance.toString(), 18)
  );

  if (liquidityBalance === 0n) {
    console.log("No liquidity to remove. Please add liquidity first.");
    return;
  }

  const liquidityToRemove = liquidityBalance / 2n;

  const usdcBalBefore = await USDC.balanceOf(AssetHolder);
  const daiBalBefore = await DAI.balanceOf(AssetHolder);

  console.log("Token Balances Before Removing Liquidity:");
  console.log("USDC Balance:", ethers.formatUnits(usdcBalBefore.toString(), 6));
  console.log("DAI Balance:", ethers.formatUnits(daiBalBefore.toString(), 18));
  console.log();

  console.log("Approving LP tokens...");
  await Pair.connect(impersonatedSigner).approve(UNIRouter, liquidityToRemove, {
    gasPrice,
    gasLimit: 100000,
  });
  console.log("LP tokens approved");

  deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  console.log("Removing liquidity...");
  const removeLiquidity = await Router.connect(
    impersonatedSigner
  ).removeLiquidity(
    USDCAddress,
    DAIAddress,
    liquidityToRemove,
    0,
    0,
    impersonatedSigner.address,
    deadline,
    { gasPrice, gasLimit: 300000 }
  );

  const receipt = await removeLiquidity.wait();
  console.log("Liquidity removed successfully!");
  console.log("Transaction hash:", receipt?.hash);
  console.log("Gas used:", receipt?.gasUsed.toString());

  const liquidityBalanceAfter = await Pair.balanceOf(AssetHolder);
  console.log(
    "LP Token Balance After:",
    ethers.formatUnits(liquidityBalanceAfter.toString(), 18)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
