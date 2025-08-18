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

  //DAI ADDRESS
  const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

  // WETH ADDRES
  const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

  // UNISWAPV2ROUTER ADDRESS
  const UNIROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  //CONNECT THE DAI ADDRESS TO THE ERC20 INTERFACE
  const DAI = await ethers.getContractAt("IERC20", DAIAddress);

  //CONNECT THE UNIV2ROUTER WITH THE INTERFACE
  const UNISWAP = await ethers.getContractAt("IUniswapV2Router01", UNIROUTER);

  console.log(
    "::::::::::::::INITIAL DAI AND ETH BALANCE BEFORE SWAP::::::::::::::::",
  );
  const initialBalance = await DAI.balanceOf(AssetHolder);
  const initialETHBalance = await ethers.provider.getBalance(AssetHolder);

  console.log(
    "INITIAL DAI BALANCE: ",
    ethers.formatUnits(initialBalance.toString(), 6),
  );

  console.log(
    "INITIAL ETH BALANCE: ",
    ethers.formatUnits(initialETHBalance.toString(), 18),
  );
  console.log("");

  console.log("::::::::::::::UPDATED DAI BALANCE AFTER SWAP::::::::::::::::");
  const swapEthForToken = await UNISWAP.connect(
    AssetHolder,
  ).swapExactETHForTokens(
    1,
    [WETHAddress, DAIAddress],
    AssetHolder.address,
    deadline,
    {
      value: ethers.parseEther("12000"),
    },
  );

  const tx = await swapEthForToken.wait();

  console.log("::::::::::::::TRANSACTION RECEIPT::::::::::::");
  console.log("SWAP SUCCESSFUL: ", tx!.hash);
  console.log("");

  console.log(
    ":::::::::::::::::::UPDATED BALANCE AFTER SWAPPING ETH FOR DAI::::::::::::::::::",
  );
  const updatedDAIBalance = await DAI.balanceOf(AssetHolder);
  const updatedETHBalance = await ethers.provider.getBalance(AssetHolder);

  console.log(
    "UPDATED DAI BALANCE: ",
    ethers.formatUnits(updatedDAIBalance.toString(), 6),
  );
  console.log(
    "UPDATED WETH BALANCE: ",
    ethers.formatUnits(updatedETHBalance.toString(), 18),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});