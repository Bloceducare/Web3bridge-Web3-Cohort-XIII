import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  const address = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const factoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

  await helpers.impersonateAccount(address);
  const AssetHolder = await ethers.getSigner(address);

  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const FACTORY = await ethers.getContractAt(
    "IUniSwap",
    factoryAddress,
  );

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

  const UNISWAP = await ethers.getContractAt("IUniSwap", IROUTER);

  //Parse the to bigint
  const USDCAmount = ethers.parseUnits("70000000", 6);

  //Call the approval function
  const ApprovedUSDC = await USDC.connect(AssetHolder).approve(
    IROUTER,
    USDCAmount,
  );

  const USDCtx = await ApprovedUSDC.wait();

//   console.log(
//     "::::::::::::::::::::::USDC APPROVAL RECEIPT::::::::::::::::::::::::::::::::::",
//   );
//   console.log("USDC transaction Receipt: ", USDCtx!.hash);
//   console.log("");
  //deadline - the amount of time a transaction should take before it reverts
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  const provideLiquidity = await UNISWAP.connect(AssetHolder).addLiquidityETH(
    USDCAddress,
    USDCAmount,
    1,
    1,
    AssetHolder,
    deadline,
    { value: ethers.parseEther("12000") },
  );

  const liquidityTx = await provideLiquidity.wait();

//   console.log(
//     "::::::::::::::::::::::LIQUIDITY ADDED RECEIPT::::::::::::::::::::::::::::::::::",
//   );
//   console.log("Liqiuidity added successfully: ", liquidityTx!.hash);
//   console.log("");
  console.log(
    ":::::::::::ASSETHOLDER UPDATED BALANCE AFTER LIQUIDITY WAS ADDED:::::::::::",
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

  console.log("");
  console.log(
    "::::::::::::::::::::::::REMOVE LIQUIDITY FROM POOLS:::::::::::::::::::::::::",
  );

  // GET POOL CONTRACT ADDRESS
  const POOL_ADDRESS = "0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640";

  // CREATE AN INSTANCE OF THE POOL TO BE ABLE TO ACCESS THE METHODS ON IT
  const UNI_ETH_POOL = await ethers.getContractAt(
    "IUniSwap",
    POOL_ADDRESS,
  );

  // GET THE LP TOKEN MINTED WHICH IS NEEDED TO BE ABLE TO REMOVE LP
  const LP_TOKEN = await UNI_ETH_POOL.balanceOf(AssetHolder);

  // REMOVE LIQUIDITY
  //APPROVE ROUTER TO SPEND THE LP ON USERS BEHALF
  await UNI_ETH_POOL.connect(AssetHolder).approve(IROUTER, LP_TOKEN);

  const removeLiquidity = await UNISWAP.connect(AssetHolder).removeLiquidityETH(
    USDCAddress,
    LP_TOKEN,
    1,
    1,
    AssetHolder.address,
    deadline,
  );

  const removeLiquidityTx = await removeLiquidity.wait();

  console.log("Liquidity removed successfully: ", removeLiquidityTx!.hash);

  console.log("");
  console.log(
    ":::::::::::::ASSETHOLDER UPDATED BALANCE AFTER LIQUIDITY HAS BEEN REMOVED::::::::::::::::",
  );

  const UpdatedUSDC = await USDC.balanceOf(AssetHolder);

  console.log(
    "Current USDC Balance: ",
    ethers.formatUnits(UpdatedUSDC.toString(), 6),
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