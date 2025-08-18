import { ethers } from "hardhat";
import { text } from "stream/consumers";
import helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const main = async() => {
    const USDCAddress  = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const DAIAddress =  "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const UNIROUTER  = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

    const USDCHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621"; 

    await helpers.impersonateAccount(USDCHolder); 
    const impersonatedAccount = await ethers.getSigner(USDCHolder); 

    const amountADesired = ethers.parseUnits("20000", 6); 
    const amountBDesired = ethers.parseUnits("20000", 18); 

    const USDC = await ethers.getContractAt("IERC20", USDCAddress); 
    const DAI = await ethers.getContractAt("IERC20", DAIAddress); 
    const ROUTER = await ethers.getContractAt("IUniswapV2Router02", UNIROUTER);

    console.log("Approving tokens for Uniswap Router...");

    let approveTx = await USDC.connect(impersonatedAccount).approve(UNIROUTER, amountADesired); 
    approveTx.wait(); 

    approveTx = await DAI.connect(impersonatedAccount).approve(UNIROUTER, amountBDesired); 
    approveTx.wait(); 

    console.log("Token Approval successful at:", approveTx.hash); 

    const usdcBalBefore = await USDC.balanceOf(impersonatedAccount.address); 
    const daiBalBefore = await DAI.balanceOf(impersonatedAccount.address); 
    
    console.log("USDC Balance Before:", ethers.formatUnits(usdcBalBefore, 6)); 
    console.log("DAI Balance Before:", ethers.formatUnits(daiBalBefore, 18));

    // Define Deadline
    const deadline = Math.floor(Date.now()/ 1000) + 60 * 10; 

    console.log("Adding liqudity to Uniswap...");
    
    const addLiquidityTx = await ROUTER.connect(impersonatedAccount).addLiquidity(
        USDCAddress, 
        DAIAddress, 
        amountADesired, 
        amountBDesired, 
        0, 
        0, 
        impersonatedAccount.address, 
        deadline 
    ); 

    await addLiquidityTx.wait();

    console.log("Liquidity successfully added at:", addLiquidityTx.hash); 

    const usdcBalAfter = await USDC.balanceOf(impersonatedAccount.address); 
    const daiBalAfter = await DAI.balanceOf(impersonatedAccount.address); 

    console.log("USDC Balance After", ethers.formatUnits(usdcBalAfter, 6)); 
    console.log("DAI Balance After:", ethers.formatUnits(daiBalAfter, 18)); 

    const FACTORY = await ethers.getContractAt(
        "IUniswapV2Factory", 
        await ROUTER.factory()
    ); 

    const pairAddress = await FACTORY.getPair(USDCAddress, DAIAddress); 
    const LPToken = await ethers.getContractAt("IERC20", pairAddress); 
    
    const lpBalance = await LPToken.balanceOf(impersonatedAccount.address); 

    console.log("LP Token Balance:", ethers.formatUnits(lpBalance, 18)); 
}; 

main().catch((error) => {
    console.log(error); 
    process.exitCode = 1; 
}); 