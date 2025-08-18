import { ethers } from "hardhat";
import { UniswapV2Router02 } from "../../typechain-types";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Interacting with Uniswap V2 Router using address:", await signer.getAddress());

  const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const router = (await ethers.getContractAt(
    "UniswapV2Router02",
    routerAddress,
    signer
  )) as unknown as UniswapV2Router02;

  const tokenA = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6b14"; 
  const tokenB = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; 

  const amountIn = ethers.parseUnits("0.01", 18); 
  const amountOutMin = 0; 
  const path = [tokenA, tokenB]; 
  const to = await signer.getAddress(); 
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; 

  console.log(`Swapping ${amountIn} of token ${tokenA} for token ${tokenB}`);

  try {
    const tokenContract = await ethers.getContractAt("IERC20", tokenA, signer);
    const approveTx = await tokenContract.approve(routerAddress, amountIn);
    await approveTx.wait();
    console.log("Approved router to spend tokens");

    const swapTx = await router.swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      path,
      to,
      deadline
    );

    const receipt = await swapTx.wait();
    console.log("Swap transaction successful!");
    console.log("Transaction hash:", swapTx.hash);
    console.log("Gas used:", receipt?.gasUsed.toString());

    const tokenBContract = await ethers.getContractAt("IERC20", tokenB, signer);
    const balance = await tokenBContract.balanceOf(to);
    console.log(`Received ${balance} of token ${tokenB}`);

    // Take a screenshot here for documentation
    console.log("Please take a screenshot of this output for documentation");
  } catch (error) {
    console.error("Error during swap:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});