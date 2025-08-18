import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  const address = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

  await helpers.impersonateAccount(address);
  const AssetHolder = await ethers.getSigner(address);

  const USDC = await ethers.getContractAt("IERC20", USDCAddress);

  const IROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  console.log(
    ":::::::::::::::::GET TOKEN BALANCE OF AssetHolder::::::::::::::::::::::::",
  );
  const initialUSDCBalance = await USDC.balanceOf(AssetHolder);

  console.log(
    "Initial USDC Balance: ",
    ethers.formatUnits(initialUSDCBalance.toString(), 6),
  );

  console.log("");

  const USDCSWAP = await ethers.getContractAt("IUniswapV2Router01", IROUTER);

  //Parse the to bigint
  const USDCAmount = ethers.parseUnits("77000000", 6);

  //Call the approval function
  const ApprovedUSDC = await USDC.connect(AssetHolder).approve(
    IROUTER,
    USDCAmount,
  );

  const USDCtx = await ApprovedUSDC.wait();

  console.log(
    "::::::::::::::::::::::USDC and ETH APPROVAL RECEIPT::::::::::::::::::::::::::::::::::",
  );
  console.log("USDC transaction Receipt: ", USDCtx!.hash);
  console.log("");
  //deadline - the amount of time a transaction should take before it reverts
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  const provideLiquidity = await USDCSWAP.connect(AssetHolder).addLiquidityETH(
    USDCAddress,
    USDCAmount,
    1,
    1,
    AssetHolder,
    deadline,
    { value: ethers.parseEther("12000") },
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

  console.log(
    "Current USDC Balance: ",
    ethers.formatUnits(UpdatedUSDCBalance.toString(), 6),
  );

  console.log(
    "Current ETH Balance: ",
    ethers.formatEther(await ethers.provider.getBalance(AssetHolder)),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
