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

  const weth = await router.WETH(); 
  const tokenOut = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; 
  const path = [weth, tokenOut]; 

  const amountIn = ethers.parseEther("1.0"); // 1 ETH

  try {
    const amounts = await router.getAmountsOut(amountIn, path);
    
    console.log(amounts);
    
    const expectedOutput = amounts[amounts.length - 1];
    
    console.log(`Input: ${ethers.formatEther(amountIn)} ETH`);
    console.log(`Expected output: ${ethers.formatUnits(expectedOutput, 18)} ${tokenOut}`);
    
    const inputValueInWei = amountIn;
    const outputValueInWei = expectedOutput;
    
    console.log(`Exchange rate: 1 ETH = ${ethers.formatUnits(outputValueInWei, 18)} ${tokenOut}`);
    
    if (path.length > 2) {
      console.log("Swap path details:");
      for (let i = 0; i < path.length - 1; i++) {
        console.log(`Step ${i+1}: ${path[i]} -> ${path[i+1]}: ${ethers.formatUnits(amounts[i], 18)} -> ${ethers.formatUnits(amounts[i+1], 18)}`);
      }
    }

    console.log("Please take a screenshot of this output for documentation");
  } catch (error) {
    console.error("Error getting amounts out:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});