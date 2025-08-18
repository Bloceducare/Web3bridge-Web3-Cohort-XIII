import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  //Address that holds the needed assest
  const address = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  //USDC and USDT contract addresses and also the UNISwapV2Router

  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const USDTAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const USDT_USDC_POOL = "0x3041CbD36888bECc7bbCBc0045E3B1f144466f5f";

  //connect the address with ethers to be able to utilize
  await helpers.impersonateAccount(address);
  const AssetHolder = await ethers.getSigner(address);

  //Get connect the token Contract and the Interface to be able to call the function on them
  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const USDT = await ethers.getContractAt("IERC20", USDTAddress);
  const UNISWAP = await ethers.getContractAt("IUniswapV2Router01", UNIRouter);
  const POOL = await ethers.getContractAt("IUniswapV2Pair", USDT_USDC_POOL);

  // GET inital balance
  const initialUSDCBalance = await USDC.balanceOf(AssetHolder);
  const initialUSDTBalance = await USDT.balanceOf(AssetHolder);

  console.log(
    ":::::::::::::::::GET TOKEN BALANCE OF ASSETHOLDER::::::::::::::::::::::::",
  );
  console.log(
    "Initial USDC Balance: ",
    ethers.formatUnits(initialUSDCBalance.toString(), 6),
  );

  console.log(
    "Initial USDT Balance: ",
    ethers.formatUnits(initialUSDTBalance.toString(), 6),
  );
  console.log("");

  //Approve token to spend
  const USDCAmount = ethers.parseUnits("70000000", 6);
  const USDTAmount = ethers.parseUnits("70000000", 6);

  const USDCApproval = await USDC.connect(AssetHolder).approve(
    UNIRouter,
    USDCAmount,
  );
  const USDTApproval = await USDT.connect(AssetHolder).approve(
    UNIRouter,
    USDTAmount,
  );

  const USDCtx = await USDCApproval.wait();
  const USDTtx = await USDTApproval.wait();

  console.log(
    "::::::::::::::::::::::USDC and USDT APPROVAL RECEIPT::::::::::::::::::::::::::::::::::",
  );
  console.log("USDC transaction Receipt: ", USDCtx!.hash);
  console.log("USDT transaction Receipt: ", USDTtx!.hash);
  console.log("");

  //To be able to REMOVE LiQUIDITY: we need to add Liquidity First
  //set a deadline: a time frame for a transaction to be reverted if it doesn't go true
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
  //Add Liquidity
  const provideLiquidity = await UNISWAP.connect(AssetHolder).addLiquidity(
    USDCAddress,
    USDTAddress,
    USDCAmount,
    USDTAmount,
    1,
    1,
    AssetHolder.address,
    deadline,
  );

  const liquidityTx = await provideLiquidity.wait();

  console.log(
    "::::::::::::::::::::::LIQUIDITY ADDED RECEIPT::::::::::::::::::::::::::::::::::",
  );
  console.log("LIQUIDITY ADDED SUCCESSFULLY: ", liquidityTx!.hash);
  console.log("");
  console.log(
    "::::::::::::::::::::::ASSETHOLDER UPDATED BALANCE::::::::::::::::::::::::::::::::::",
  );
  const UpdatedUSDCBalance = await USDC.balanceOf(AssetHolder);
  const UpdatedUSDTBalance = await USDT.balanceOf(AssetHolder);

  console.log(
    "Current USDC Balance: ",
    ethers.formatUnits(UpdatedUSDCBalance.toString(), 6),
  );
  console.log(
    "Current USDT Balance: ",
    ethers.formatUnits(UpdatedUSDTBalance.toString(), 6),
  );

  // GET THE AMOUNT OF LP TOKEN MINTED TO THE LP PROVIDER ADDRESS
  const LP_AMOUNT = await POOL.balanceOf(AssetHolder);

  // CONVERT IT TO STRING AND PARSE IT TO FLOAT TO BE ABLE TO GET 50% OF THE RETURNED VALUE
  const AMOUNT_OF_LP =
    parseFloat(ethers.formatUnits(LP_AMOUNT.toString(), 6)) * 0.5;

  // CONVERT THE VALUE BACK BIG INT AND ROUND IT UP TO 2 DECIMAL PLACE BECAUSE OF UNDER_FLOW/OVER_FLOW
  const AMOUNT_TO_REMOVE = ethers.parseUnits(AMOUNT_OF_LP.toFixed(2), 6);

  // Approve contract to be able to pull out liquidity
  await POOL.connect(AssetHolder).approve(UNIRouter, AMOUNT_TO_REMOVE);

  // const amountOfUSDCtoRemove = ethers.parseUnits("10000000", 6);
  // const amountOfUSDTtoRemove = ethers.parseUnits("10000000", 6);

  // REMOVE LIQUIDY
  const removeLiquidity = await UNISWAP.connect(AssetHolder).removeLiquidity(
    USDCAddress,
    USDTAddress,
    AMOUNT_TO_REMOVE,
    1,
    1,
    AssetHolder.address,
    deadline,
  );

  const removeLiquidityTx = await removeLiquidity.wait();

  console.log(
    "::::::::::::::::::::::REMOVED 50% FROM LIQUIDITY POOL::::::::::::::::::::::::::::::::::",
  );
  console.log("LIQUIDITY REMOVED SUCCESSFULLY: ", removeLiquidityTx!.hash);
  console.log("");
  console.log(
    "::::::::::::::::::::::ASSETHOLDER UPDATED BALANCE::::::::::::::::::::::::::::::::::",
  );
  const UpdatedUSDCBalanceAfterLiquidity = await USDC.balanceOf(AssetHolder);
  const UpdatedUSDTBalanceAferLiquidity = await USDT.balanceOf(AssetHolder);

  console.log(
    "Current USDC Balance: ",
    ethers.formatUnits(UpdatedUSDCBalanceAfterLiquidity.toString(), 6),
  );
  console.log(
    "Current USDT Balance: ",
    ethers.formatUnits(UpdatedUSDTBalanceAferLiquidity.toString(), 6),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
