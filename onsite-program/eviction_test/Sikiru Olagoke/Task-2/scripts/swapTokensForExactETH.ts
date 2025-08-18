import { parseEther } from "ethers";
import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  //ADDRESS WITH REAL FUNDS
  const address = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  //DEADLINE
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  // CREATE A WALLET OUT OF THE ADDRESS FOR TESTING
  await ethers.getImpersonatedSigner(address);
  const AssetHolder = await ethers.getSigner(address);

  //USDT ADDRESS
  const USDTAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

  // WETH ADDRES
  const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

  // UNISWAPV2ROUTER ADDRESS
  const UNIROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  //CONNECT THE USDT ADDRESS TO THE ERC20 INTERFACE
  const USDT = await ethers.getContractAt("IERC20", USDTAddress);

  //CONNECT THE UNIV2ROUTER WITH THE INTERFACE
  const UNISWAP = await ethers.getContractAt("IUniswapV2Router01", UNIROUTER);

  console.log(
    "::::::::::::::INITIAL USDT AND ETH BALANCE BEFORE SWAP::::::::::::::::",
  );
  const initialBalance = await USDT.balanceOf(AssetHolder);
  const initialETHBalance = await ethers.provider.getBalance(AssetHolder);

  console.log(
    "INITIAL USDT BALANCE: ",
    ethers.formatUnits(initialBalance.toString(), 6),
  );

  console.log(
    "INITIAL ETH BALANCE: ",
    ethers.formatUnits(initialETHBalance.toString(), 18),
  );
  console.log("");

  const AMOUNT_TO_SPEND = ethers.parseUnits("70000000", 6);

  // APPROVE USDT FOR SPENDING
  await USDT.connect(AssetHolder).approve(UNIROUTER, AMOUNT_TO_SPEND);

  console.log("::::::::::::::UPDATED USDT BALANCE AFTER SWAP::::::::::::::::");
  const swapTokenForEth = await UNISWAP.connect(
    AssetHolder,
  ).swapTokensForExactETH(
    ethers.parseEther("3000"),
    AMOUNT_TO_SPEND,
    [USDTAddress, WETHAddress],
    AssetHolder.address,
    deadline,
  );

  const tx = await swapTokenForEth.wait();

  console.log("::::::::::::::TRANSACTION RECEIPT::::::::::::");
  console.log("SWAP SUCCESSFUL: ", tx!.hash);
  console.log("");

  console.log(
    ":::::::::::::::::::UPDATED BALANCE AFTER SWAPPING ETH FOR USDT::::::::::::::::::",
  );
  const updatedUSDTBalance = await USDT.balanceOf(AssetHolder);
  const updatedETHBalance = await ethers.provider.getBalance(AssetHolder);

  console.log(
    "UPDATED USDT BALANCE: ",
    ethers.formatUnits(updatedUSDTBalance.toString(), 6),
  );
  console.log(
    "UPDATED USDT BALANCE: ",
    ethers.formatUnits(updatedETHBalance.toString(), 18),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
