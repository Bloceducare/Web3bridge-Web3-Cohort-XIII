import { ethers } from "hardhat";
import { IUniswapV2Pair__factory } from "../typechain-types";
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

async function main() {
  const address = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const USDTAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

  await helpers.impersonateAccount(address);
  const AssetHolder = await ethers.getSigner(address);

  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const USDT = await ethers.getContractAt("IERC20", USDTAddress);

  const IROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  console.log(
    ":::::::::::::::::GET TOKEN BALANCE OF AssetHolder::::::::::::::::::::::::",
  );
  const initialUSDCBalance = await USDC.balanceOf(AssetHolder);
  const initialUSDTBalance = await USDT.balanceOf(AssetHolder);

  console.log(
    "Initial USDC Balance: ",
    ethers.formatUnits(initialUSDCBalance.toString(), 6),
  );

  console.log(
    "Initial USDT Balance: ",
    ethers.formatUnits(initialUSDTBalance.toString(), 6),
  );

  console.log("");

  const UNISWAP = await ethers.getContractAt("IUniswapV2Router01", IROUTER);

  //Parse the to bigint
  const USDTAmount = ethers.parseUnits("70000000", 6);
  const USDCAmount = ethers.parseUnits("70000000", 6);

  //Call the approval function
  const ApprovedUSDC = await USDC.connect(AssetHolder).approve(
    IROUTER,
    USDCAmount,
  );
  const ApprovedUSDT = await USDT.connect(AssetHolder).approve(
    IROUTER,
    USDTAmount,
  );

  const USDCtx = await ApprovedUSDC.wait();
  const USDTtx = await ApprovedUSDT.wait();

  console.log(
    "::::::::::::::::::::::USDC and USDT APPROVAL RECEIPT::::::::::::::::::::::::::::::::::",
  );
  console.log("USDC transaction Receipt: ", USDCtx!.hash);
  console.log("USDT transaction Receipt: ", USDTtx!.hash);
  console.log("");
  //deadline - the amount of time a transaction should take before it reverts
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  const provideLiquidity = await UNISWAP.connect(AssetHolder).addLiquidity(
    USDCAddress,
    USDTAddress,
    USDCAmount,
    USDTAmount,
    1,
    1,
    AssetHolder,
    deadline,
  );

  const liquidityTx = await provideLiquidity.wait();

  console.log(
    "::::::::::::::::::::::LIQUIDITY ADDED RECEIPT::::::::::::::::::::::::::::::::::",
  );
  console.log("Liqiuidity added successfully: ", liquidityTx!.hash);
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
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
