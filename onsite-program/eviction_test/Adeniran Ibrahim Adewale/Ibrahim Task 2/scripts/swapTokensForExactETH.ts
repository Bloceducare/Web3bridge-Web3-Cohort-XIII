import helper = require("@nomicfoundation/hardhat-network-helpers");
import { ethers } from "hardhat";

async function SwapEth() {
  const AssetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await helper.impersonateAccount(AssetHolder);
  const impersonatedSigner = await ethers.getSigner(AssetHolder);

  // WETH contract address
  const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

  // UNISWAP contract Address
  const UNISWAPAddress = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";

  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  const WETH = await ethers.getContractAt("IERC20", wethAddress);
  const UNISWAP = await ethers.getContractAt("IERC20", UNISWAPAddress);

  const WETHbal = await WETH.balanceOf(AssetHolder);
  const UNISWAPbal = await UNISWAP.balanceOf(AssetHolder);

  console.log("################## initial balance ###################");

  console.log(
    "user initial WETH balance",
    ethers.formatUnits(WETHbal.toString(), 18)
  );
  console.log(
    "user initial UNISWAP balance",
    ethers.formatUnits(UNISWAPbal.toString(), 18)
  );

  const Router = await ethers.getContractAt("IUniSwap", UNIRouter);

  // Define the desired output amount in ETH (20 ETH)
  const desiredETHOut = ethers.parseUnits("20", 18);
  
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  // Path: UNI -> WETH (for swapTokensForExactETH, we need WETH as the final token)
  const path = [UNISWAPAddress, wethAddress];

  try {
    // Get the required UNI input for desired ETH output
    const amountsIn = await Router.getAmountsIn(desiredETHOut, path);
    const requiredUNIInput = amountsIn[0];

    console.log(
      "Required UNI input:",
      ethers.formatUnits(requiredUNIInput.toString(), 18)
    );

    // Check if user has enough UNI tokens
    if (UNISWAPbal < requiredUNIInput) {
      throw new Error(
        `Insufficient UNI balance. Required: ${ethers.formatUnits(
          requiredUNIInput.toString(),
          18
        )}, Available: ${ethers.formatUnits(UNISWAPbal.toString(), 18)}`
      );
    }

    // Approve the required UNI input (with some buffer for price impact)
    const approvalAmount = requiredUNIInput * 110n / 100n; // Add 10% buffer
    const approvalTx = await UNISWAP.connect(impersonatedSigner).approve(
      UNIRouter,
      approvalAmount
    );

    await approvalTx.wait();
    console.log("Approval successful");

    // Perform the swap: UNI tokens for exact ETH
    const SwapTx = await Router.connect(impersonatedSigner).swapTokensForExactETH(
      desiredETHOut,        // Amount of ETH we want to receive
      requiredUNIInput,     // Maximum UNI tokens we're willing to spend
      path,                 // Token path: UNI -> WETH
      AssetHolder,          // Recipient address
      deadline              // Transaction deadline
    );

    const tx3 = await SwapTx.wait();
    console.log("Swap successful, transaction hash:", tx3?.hash);

  } catch (error) {
    console.error("Error during swap:", error);
    throw error;
  }

  const WETHBalAfter = await WETH.balanceOf(AssetHolder);
  const UNISWAPBalAfter = await UNISWAP.balanceOf(AssetHolder);
  const ETHBalAfter = await ethers.provider.getBalance(AssetHolder);

  console.log(
    "############################# FINAL BALANCE ###########################"
  );
  console.log(
    "user final WETH balance",
    ethers.formatUnits(WETHBalAfter.toString(), 18)
  );
  console.log(
    "user final UNISWAP balance",
    ethers.formatUnits(UNISWAPBalAfter.toString(), 18)
  );
  console.log(
    "user final ETH balance",
    ethers.formatUnits(ETHBalAfter.toString(), 18)
  );
}

SwapEth().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});