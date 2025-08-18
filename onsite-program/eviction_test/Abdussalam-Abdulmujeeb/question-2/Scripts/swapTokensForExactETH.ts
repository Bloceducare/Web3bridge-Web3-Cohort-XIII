// import { parseEther } from "ethers";
// import { ethers } from "hardhat";
// const helpers = require("@nomicfoundation/hardhat-network-helpers");

// async function main() {
//   //ADDRESS WITH REAL FUNDS
//   const address = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

//   //DEADLINE
//   const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

//   // CREATE A WALLET OUT OF THE ADDRESS FOR TESTING
//   await ethers.getImpersonatedSigner(address);
//   const AssetHolder = await ethers.getSigner(address);

//   //DAI ADDRESS
//   const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

//   // WETH ADDRES
//   const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

//   // UNISWAPV2ROUTER ADDRESS
//   const UNIROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

//   //CONNECT THE USDT ADDRESS TO THE ERC20 INTERFACE
//   const DAI = await ethers.getContractAt("IERC20", DAIAddress);

//   //CONNECT THE UNIV2ROUTER WITH THE INTERFACE
//   const UNISWAP = await ethers.getContractAt("IUniswapV2Router01", UNIROUTER);

//   console.log(
//     "::::::::::::::INITIAL USDT AND ETH BALANCE BEFORE SWAP::::::::::::::::",
//   );
//   const initialDAIBalance = await DAI.balanceOf(AssetHolder);
//   const initialETHBalance = await ethers.provider.getBalance(AssetHolder);

//   console.log(
//     "INITIAL DAI BALANCE: ",
//     ethers.formatUnits(initialDAIBalance.toString(), 18),
//   );

//   console.log(
//     "INITIAL ETH BALANCE: ",
//     ethers.formatUnits(initialETHBalance.toString(), 18),
//   );
//   console.log("");

//   const AMOUNT_TO_SPEND = ethers.parseUnits("7000000", 18);

//   // APPROVE USDT FOR SPENDING
//   await DAI.connect(AssetHolder).approve(UNIROUTER, AMOUNT_TO_SPEND);

//   console.log("::::::::::::::UPDATED USDT BALANCE AFTER SWAP::::::::::::::::");
//   const swapTokenForEth = await UNISWAP.connect(
//     AssetHolder,
//   ).swapTokensForExactETH(
//     ethers.parseEther("200000"),
//     AMOUNT_TO_SPEND,
//     [DAIAddress, WETHAddress],
//     AssetHolder.address,
//     deadline,
//   );

//   const tx = await swapTokenForEth.wait();

//   console.log("::::::::::::::TRANSACTION RECEIPT::::::::::::");
//   console.log("SWAP SUCCESSFUL: ", tx!.hash);
//   console.log("");

//   console.log(
//     ":::::::::::::::::::UPDATED BALANCE AFTER SWAPPING ETH FOR USDT::::::::::::::::::",
//   );
//   const updatedDAIBalance = await DAI.balanceOf(AssetHolder);
//   const updatedETHBalance = await ethers.provider.getBalance(AssetHolder);

//   console.log(
//     "UPDATED DAI BALANCE: ",
//     ethers.formatUnits(updatedDAIBalance.toString(), 18),
//   );
//   console.log(
//     "UPDATED ETH BALANCE: ",
//     ethers.formatUnits(updatedETHBalance.toString(), 18),
//   );
// }

// main().catch((err) => {
//   console.error(err);
//   process.exit(1);
// });




import { ethers } from "hardhat";

async function main() {
  // ADDRESS WITH REAL FUNDS (mainnet fork impersonation)
  const address = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  // DEADLINE (10 minutes from now)
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  // CREATE A WALLET OUT OF THE ADDRESS FOR TESTING
  await ethers.getImpersonatedSigner(address);
  const AssetHolder = await ethers.getSigner(address);

  // DAI ADDRESS
  const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

  // WETH ADDRESS
  const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

  // UNISWAP V2 ROUTER ADDRESS
  const UNIROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  // CONNECT THE DAI CONTRACT
  const DAI = await ethers.getContractAt("IERC20", DAIAddress);

  // CONNECT THE UNISWAP ROUTER
  const UNISWAP = await ethers.getContractAt("IUniswapV2Router01", UNIROUTER);

  console.log(":::::::::::::: INITIAL DAI AND ETH BALANCES ::::::::::::::::");
  const initialDAIBalance = await DAI.balanceOf(AssetHolder);
  const initialETHBalance = await ethers.provider.getBalance(AssetHolder);

  console.log("INITIAL DAI BALANCE:", ethers.formatUnits(initialDAIBalance, 18));
  console.log("INITIAL ETH BALANCE:", ethers.formatUnits(initialETHBalance, 18));
  console.log("");

  // AMOUNTS
  const EXPECTED_ETH = ethers.parseEther("1"); // request exactly 1 ETH
  const AMOUNT_TO_SPEND = ethers.parseUnits("10000", 18); // max 10,000 DAI allowed

  // APPROVE DAI FOR SPENDING
  await DAI.connect(AssetHolder).approve(UNIROUTER, AMOUNT_TO_SPEND);

  console.log(":::::::::::::: SWAPPING ::::::::::::::::");
  const swapTokenForEth = await UNISWAP.connect(AssetHolder).swapTokensForExactETH(
    EXPECTED_ETH,       // exact ETH you want
    AMOUNT_TO_SPEND,    // max DAI you're willing to spend
    [DAIAddress, WETHAddress],
    AssetHolder.address,
    deadline,
  );

  const tx = await swapTokenForEth.wait();

  console.log(":::::::::::::: TRANSACTION RECEIPT ::::::::::::::::");
  console.log("SWAP SUCCESSFUL. HASH:", tx!.hash);
  console.log("");

  console.log(":::::::::::::: UPDATED BALANCES ::::::::::::::::");
  const updatedDAIBalance = await DAI.balanceOf(AssetHolder);
  const updatedETHBalance = await ethers.provider.getBalance(AssetHolder);

  console.log("UPDATED DAI BALANCE:", ethers.formatUnits(updatedDAIBalance, 18));
  console.log("UPDATED ETH BALANCE:", ethers.formatUnits(updatedETHBalance, 18));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
