import { ethers } from "hardhat";
// Remove duplicate import since IUniswapV2Router02 is already imported below
import { IUniswapV2Router02 } from "./IUniswapRouter";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Interacting with Uniswap V2 Router using address:", await signer.getAddress());

  const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const router = (await ethers.getContractAt(
    "UniswapV2Router02",
    routerAddress,
    signer
  )) as unknown as UniswapV2Router;

 
  const tokenA = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6b14"; 
  const tokenB = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; 
  const amountADesired = ethers.parseUnits("0.1", 18); 
  const amountBDesired = ethers.parseUnits("0.1", 18); 
  const amountAMin = ethers.parseUnits("0.09", 18); 
  const amountBMin = ethers.parseUnits("0.09", 18); 
  const to = await signer.getAddress(); 
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; 

  console.log(`Adding liquidity: ${amountADesired} of token ${tokenA} and ${amountBDesired} of token ${tokenB}`);

  try {
    const tokenAContract = await ethers.getContractAt("IERC20", tokenA, signer);
    const tokenBContract = await ethers.getContractAt("IERC20", tokenB, signer);
    
    const approveATx = await tokenAContract.approve(routerAddress, amountADesired);
    await approveATx.wait();
    console.log("Approved router to spend tokenA");
    
    const approveBTx = await tokenBContract.approve(routerAddress, amountBDesired);
    await approveBTx.wait();
    console.log("Approved router to spend tokenB");

    const addLiquidityTx = await router.addLiquidity(
      tokenA,
      tokenB,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin,
      to,
      deadline
    );

    const receipt = await addLiquidityTx.wait();
    console.log("Add liquidity transaction successful!");
    console.log("Transaction hash:", addLiquidityTx.hash);
    console.log("Gas used:", receipt?.gasUsed.toString());

    const factoryAddress = await router.factory();
    const factory = await ethers.getContractAt("IUniswapV2Factory", factoryAddress, signer);
    const pairAddress = await factory.getPair(tokenA, tokenB);
    console.log(`Liquidity added to pair: ${pairAddress}`);

    const pairContract = await ethers.getContractAt("IERC20", pairAddress, signer);
    const lpBalance = await pairContract.balanceOf(to);
    console.log(`Received ${lpBalance} LP tokens`);

    console.log("Please take a screenshot of this output for documentation");
  } catch (error) {
    console.error("Error adding liquidity:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});