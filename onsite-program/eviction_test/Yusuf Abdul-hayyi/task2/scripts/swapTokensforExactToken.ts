import { formatUnits } from "ethers";
import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  //Address that holds the needed assest
  const address = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  //USDC and USDT contract addresses and also the UNISwapV2Router

  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const USDTAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  //connect the address with ethers to be able to utilize
  await helpers.impersonateAccount(address);
  const AssetHolder = await ethers.getSigner(address);

  //Get connect the token Contract and the Interface to be able to call the function on them
  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const USDT = await ethers.getContractAt("IERC20", USDTAddress);
  const UNISWAP = await ethers.getContractAt("IUniswapV2Router01", UNIRouter);

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
  const USDTAmount = ethers.parseUnits("77100000", 6);

  const USDCAmount = ethers.parseUnits("80000000", 6);

  const USDTApproval = await USDT.connect(AssetHolder).approve(
    UNIRouter,
    USDTAmount,
  );

  const USDCApproval = await USDC.connect(AssetHolder).approve(
    UNIRouter,
    USDCAmount,
  );

  const USDTtx = await USDTApproval.wait();
  const USDCtx = await USDCApproval.wait();

  console.log(
    "::::::::::::::::::::::USDT APPROVAL RECEIPT::::::::::::::::::::::::::::::::::",
  );
  console.log("USDT transaction Receipt: ", USDTtx!.hash);
  console.log("");

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
  const AMOUNT_TO_BE_SWAPPED = ethers.parseUnits("77000000", 6);
  const EXPECTED_AMOUNT = ethers.parseUnits("10000000", 6);

  // Call the UNISWAP SWAP function
  const swapToken = await UNISWAP.connect(AssetHolder).swapTokensForExactTokens(
    EXPECTED_AMOUNT,
    AMOUNT_TO_BE_SWAPPED,
    [USDTAddress, USDCAddress],
    AssetHolder.address,
    deadline,
  );

  console.log(
    "::::::::::::::::::::::SWAP USDT TO USDC RECEIPT::::::::::::::::::::::::::::::::::",
  );
  console.log("USDT TO USDC SWAPPED SUCCESSFULLY: ", swapToken!.hash);
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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});