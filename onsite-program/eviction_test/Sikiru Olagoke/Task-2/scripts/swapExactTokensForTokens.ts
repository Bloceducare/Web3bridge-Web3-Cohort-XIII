import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  //Address that holds the needed assest
  const address = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  //SHIBAINU and USDT contract addresses and also the UNISwapV2Router

  const SHIBAINUAddress = "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE";
  const USDTAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  //connect the address with ethers to be able to utilize
  await helpers.impersonateAccount(address);
  const AssetHolder = await ethers.getSigner(address);

  //Get connect the token Contract and the Interface to be able to call the function on them
  const SHIBAINU = await ethers.getContractAt("IERC20", SHIBAINUAddress);
  const USDT = await ethers.getContractAt("IERC20", USDTAddress);
  const UNISWAP = await ethers.getContractAt("IUniswapV2Router01", UNIRouter);

  // GET inital balance
  const initialSHIBAINUBalance = await SHIBAINU.balanceOf(AssetHolder);
  const initialUSDTBalance = await USDT.balanceOf(AssetHolder);

  console.log(
    ":::::::::::::::::GET TOKEN BALANCE OF ASSETHOLDER::::::::::::::::::::::::",
  );
  console.log(
    "Initial SHIBAINU Balance: ",
    ethers.formatUnits(initialSHIBAINUBalance.toString(), 18),
  );

  console.log(
    "Initial USDT Balance: ",
    ethers.formatUnits(initialUSDTBalance.toString(), 6),
  );
  console.log("");

  //Approve token to spend
  const USDTAmount = ethers.parseUnits("7000000", 6);

  const USDTApproval = await USDT.connect(AssetHolder).approve(
    UNIRouter,
    USDTAmount,
  );

  const USDTtx = await USDTApproval.wait();

  console.log(
    "::::::::::::::::::::::USDT APPROVAL RECEIPT::::::::::::::::::::::::::::::::::",
  );
  console.log("USDT transaction Receipt: ", USDTtx!.hash);
  console.log("");

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
  const AMOUNT_TO_BE_SWAPPED = ethers.parseUnits("5000000", 6);

  // Call the UNISWAP SWAP function
  const swapToken = await UNISWAP.connect(AssetHolder).swapExactTokensForTokens(
    AMOUNT_TO_BE_SWAPPED,
    1,
    [USDTAddress, SHIBAINUAddress],
    AssetHolder.address,
    deadline,
  );

  console.log(
    "::::::::::::::::::::::SWAP USDT TO SHIBAINU RECEIPT::::::::::::::::::::::::::::::::::",
  );
  console.log("USDT TO SHIBAINU SWAPPED SUCCESSFULLY: ", swapToken!.hash);
  console.log("");
  console.log(
    "::::::::::::::::::::::ASSETHOLDER UPDATED BALANCE::::::::::::::::::::::::::::::::::",
  );
  const UpdatedSHIBAINUBalance = await SHIBAINU.balanceOf(AssetHolder);
  const UpdatedUSDTBalance = await USDT.balanceOf(AssetHolder);

  console.log(
    "Current SHIBAINU Balance: ",
    ethers.formatUnits(UpdatedSHIBAINUBalance.toString(), 18),
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
