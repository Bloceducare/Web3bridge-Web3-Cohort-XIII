import {time,
  loadFixture,
  impersonateAccount,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
// const helpers = require("@nomicfoundation/hardhat-network-helpers");
import { ethers } from "hardhat";
const helpers = require ("@nomicfoundation/hardhat-network-helpers");



async function main (){
    const assestHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";
    const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const UNISWAPROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const DAIAMOUNT = ethers.parseUnits("1000", 18);
    const USDCAMOUNT = ethers.parseUnits("1000", 6);
    const DEADLINE = Math.floor(Date.now() / 1000) + 60 * 20;
    const DAIAMOUNTMIN = ethers.parseUnits("500", 18);
    const USDCAMOUNTMIN = ethers.parseUnits("500", 6);
    const ETHAMOUNTMIN = ethers.parseEther("0.1");
    const UNISWAPV2FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"


    
    

    helpers.impersonateAccount(assestHolder);

    const imposterAccount = await ethers.getSigner(assestHolder);
  
    // const [owner] = await ethers.getSigners();
    console.log("Imposter account address:::::::::::::::", imposterAccount.address);

    const USDCContract = await ethers.getContractAt("IERC20", USDCAddress);
    const DAIContract = await ethers.getContractAt("IERC20", DAIAddress);
      const usdcbalance22 = await USDCContract.balanceOf(imposterAccount.address);
          console.log("Imposter account balance from usdc:::::::::::::::", ethers.formatUnits(usdcbalance22.toString(), 6));



      console.log("USDC ADDRESS address:::::::::::::::", USDCContract.target);
      console.log("IDIAaddress:::::::::::::::", DAIContract.target);


    
    

    const usdcbalance = await USDCContract.balanceOf(imposterAccount.address);
    const daiBalance = await DAIContract.balanceOf(assestHolder);
    console.log("Imposter account balance from usdc:::::::::::::::", ethers.formatUnits(usdcbalance.toString(), 6));
    console.log("Imposter account balance from dai:::::::::::::::", ethers.formatUnits(daiBalance.toString(), 18));

     // APPROVE UNISWAP TO SPEND 
    await USDCContract.connect(imposterAccount).approve(UNISWAPROUTER, ethers.parseUnits("10000", 6));
    const UsdcApprovedAmount   = await USDCContract.connect(imposterAccount).allowance(imposterAccount.address, UNISWAPROUTER);
    console.log("USDC Contract approved for Uniswap Router Amount :::::::::::::: ", ethers.formatUnits(UsdcApprovedAmount, 6));

    // UNISWAP ROUTER CONTRACT
    const uniswap = await ethers.getContractAt("IUniswapV2Router01", UNISWAPROUTER);

    // UNISWAP ADD LIQUIDITY ETH
    const tx1 = await uniswap.connect(imposterAccount).addLiquidityETH(USDCAddress, USDCAMOUNT, USDCAMOUNTMIN,ETHAMOUNTMIN, assestHolder, DEADLINE, {value : ethers.parseEther("0.3")});
    const receipt1 = (await tx1).wait();
    console.log("Transaction status (ADD LIQUIDITY ETH)::::::::::::::::", await receipt1);
    //GET PAIR
    const uniswapfactoryContract = await ethers.getContractAt("IUniswapV2Factory", UNISWAPV2FACTORY);

    const liquidityPoolAddress = await uniswapfactoryContract.connect(imposterAccount).getPair(USDCAddress, DAIAddress);
    console.log("Liquidity Pool Address ::::::::::::::::", liquidityPoolAddress);

//     // GET LIQUIDITY TOKEN 
//     const liquidityTokenContract = await ethers.getContractAt("IERC20", liquidityPoolAddress);
//     const liquidityBalance = await liquidityTokenContract.connect(imposterAccount).balanceOf(assestHolder);
//     console.log("Liquidity Token Balance ::::::::::::::::", ethers.formatUnits(liquidityBalance, 18));

//     const LPADDRESS = await ethers.getContractAt("IERC20", liquidityPoolAddress);
//     const LPBalance = await LPADDRESS.connect(imposterAccount).balanceOf(imposterAccount.address)
//     await LPADDRESS.connect(imposterAccount).approve(UNISWAPROUTER, liquidityBalance);
//     console.log("Liquidity Pool Balance ::::::::::::::::", ethers.formatUnits(LPBalance, 18));
//     const newUsdcbalance = await USDCContract.balanceOf(assestHolder);
//     console.log("Imposter account balance from usdc after adding liquidity:::::::::::::::", newUsdcbalance.toString());


//     const removedLiquidity = await uniswap.connect(imposterAccount).removeLiquidity(USDCAddress,DAIAddress, liquidityBalance, USDCAMOUNTMIN, DAIAMOUNTMIN, imposterAccount.address, DEADLINE);
//    const receipt2 = await removedLiquidity.wait();
//    const newUsdcbalance2 = await USDCContract.balanceOf(assestHolder);



//     console.log("Removed Liquidity ::::::::::::::::", receipt2?.status === 1 ? "Success" : "Failed");



    



}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});