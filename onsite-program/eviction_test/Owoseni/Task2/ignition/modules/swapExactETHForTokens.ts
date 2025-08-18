import { ethers } from "hardhat";
import { IUniswapV2Router02 } from "../../typechain-types";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Interacting with Uniswap V2 Router using address:", await signer.getAddress());

  const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const router = (await ethers.getContractAt(
    "UniswapV2Router02",
    routerAddress,
    signer
  )) as unknown as UniswapV2Router02;

  
  const weth = await router.WETH(); 
  const tokenOut = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; 

  const amountETH = ethers.parseEther("0.01"); 
  const amountOutMin = 0; 
  const path = [weth, tokenOut]; 
  const to = await signer.getAddress(); 
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; 

  console.log(`Swapping ${amountETH} ETH for token ${tokenOut}`);

  try {
    const swapTx = await router.swapExactETHForTokens(
      amountOutMin,
      path,
      to,
      deadline,
      { value: amountETH } 
    );

    const receipt = await swapTx.wait();
    console.log("Swap transaction successful!");
    console.log("Transaction hash:", swapTx.hash);
    console.log("Gas used:", receipt?.gasUsed.toString());

    const tokenContract = await ethers.getContractAt("IERC20", tokenOut, signer);
    const balance = await tokenContract.balanceOf(to);
    console.log(`Received ${balance} of token ${tokenOut}`);

    console.log("Please take a screenshot of this output for documentation");
  } catch (error) {
    console.error("Error during swap:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});