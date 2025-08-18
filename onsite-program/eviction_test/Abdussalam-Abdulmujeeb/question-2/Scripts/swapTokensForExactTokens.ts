import { formatUnits } from "ethers";
import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  //Address that holds the needed assest
  const address = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  //USDC and USDT contract addresses and also the UNISwapV2Router

  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  //connect the address with ethers to be able to utilize
  await helpers.impersonateAccount(address);
  const AssetHolder = await ethers.getSigner(address);

  //Get connect the token Contract and the Interface to be able to call the function on them
  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const DAI = await ethers.getContractAt("IERC20", DAIAddress);
  const UNISWAP = await ethers.getContractAt("IUniswapV2Router01", UNIRouter);

  // GET inital balance
  const initialUSDCBalance = await USDC.balanceOf(AssetHolder);
  const initialDAIBalance = await DAI.balanceOf(AssetHolder);

  console.log(
    ":::::::::::::::::GET TOKEN BALANCE OF ASSETHOLDER::::::::::::::::::::::::",
  );
  console.log(
    "Initial USDC Balance: ",
    ethers.formatUnits(initialUSDCBalance.toString(), 6),
  );

  console.log(
    "Initial DAI Balance: ",
    ethers.formatUnits(initialDAIBalance.toString(), 18),
  );
  console.log("");

  //Approve token to spend
  const DAIAmount = ethers.parseUnits("77000000", 18);

  const USDCAmount = ethers.parseUnits("77000000", 6);

  const DAIApproval = await DAI.connect(AssetHolder).approve(
    UNIRouter,
    DAIAmount,
  );

  const USDCApproval = await USDC.connect(AssetHolder).approve(
    UNIRouter,
    USDCAmount,
  );

  const DAItx = await DAIApproval.wait();
  const USDCtx = await USDCApproval.wait();

  console.log(
    "::::::::::::::::::::::DAI APPROVAL RECEIPT::::::::::::::::::::::::::::::::::",
  );
  console.log("DAI transaction Receipt: ", DAItx!.hash);
  console.log("");

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
  const AMOUNT_TO_BE_SWAPPED = ethers.parseUnits("70000", 6);
  const EXPECTED_AMOUNT = ethers.parseUnits("1000", 6);
  const feeData = await ethers.provider.getFeeData();

  // Call the UNISWAP SWAP function
  const swapToken = await UNISWAP.connect(AssetHolder).swapTokensForExactTokens(
    EXPECTED_AMOUNT,
    AMOUNT_TO_BE_SWAPPED,
    [DAIAddress, USDCAddress],
    AssetHolder.address,
    deadline,
  );

  console.log(
    "::::::::::::::::::::::SWAP DAI TO USDC RECEIPT::::::::::::::::::::::::::::::::::",
  );
  console.log("DAI TO USDC SWAPPED SUCCESSFULLY: ", swapToken!.hash);
  console.log("");
  console.log(
    "::::::::::::::::::::::ASSETHOLDER UPDATED BALANCE::::::::::::::::::::::::::::::::::",
  );
  const UpdatedUSDCBalance = await USDC.balanceOf(AssetHolder);
  const UpdatedDAIBalance = await DAI.balanceOf(AssetHolder);

  console.log(
    "Current USDC Balance: ",
    ethers.formatUnits(UpdatedUSDCBalance.toString(), 6),
  );
  console.log(
    "Current DAI Balance: ",
    ethers.formatUnits(UpdatedDAIBalance.toString(), 18),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});