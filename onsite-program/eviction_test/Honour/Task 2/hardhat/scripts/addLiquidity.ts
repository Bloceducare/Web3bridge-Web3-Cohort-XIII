import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
    const usdc_address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    const dai_address = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
    const impersonator_address = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621"
    const router_address = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
    const pool_address = "0xAE461cA67B15dc8dc81CE7615e0320dA1A9aB8D5"

    await helpers.impersonateAccount(impersonator_address);
    const impersonatedSigner = await ethers.getSigner(impersonator_address);

    const USDC = await ethers.getContractAt("IERC20", usdc_address);
    const DAI = await ethers.getContractAt("IERC20", dai_address);
    const Router = await ethers.getContractAt("IUniswapV2Router02", router_address);
    const Pool = await ethers.getContractAt("IUniswapV2Pair", pool_address);

    const initialusdcbalance = await USDC.balanceOf(impersonator_address);
    const initialdaibalance = await DAI.balanceOf(impersonator_address);
    const initialusdcpoolbalance =await USDC.balanceOf(pool_address);
    const initialdaipoolbalance = await DAI.balanceOf(pool_address);
    const initialpoolbalance = await Pool.balanceOf(pool_address);

    console.log("--------- Checking Initial Balances ----------");

    console.log("Initial USDC Balance", ethers.formatUnits (initialusdcbalance));
    console.log("Initial DAI Balance", ethers.formatUnits(initialdaibalance));
    console.log("Initial USDC Pool Balance", ethers.formatUnits(initialusdcpoolbalance));
    console.log("Initial DAU Pool Balance", ethers.formatUnits(initialdaipoolbalance));
    console.log("Initial Pool Balance", ethers.formatUnits(initialpoolbalance));


    console.log("###----$$$-ADDING LIQUIDITY-$$$----###")

      
    const amountA = await ethers.parseUnits("1000",6);
    const amountB = await ethers.parseUnits("1000",18);
    const amountAmin = await ethers.parseUnits("2000",6);
    const amountBmin = await ethers.parseUnits("2000",18);
    // const pool = await ethers.parse
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

    // initiating 

    const ApproveUSDCTx = await USDC.connect(impersonatedSigner).approve(router_address,usdc_address);
    await ApproveUSDCTx.wait()

    const ApproveDAITx = await DAI.connect(impersonatedSigner).approve(router_address,dai_address);
    await ApproveDAITx.wait()

  try{
    const addLiquidity =  await Router.connect(impersonatedSigner).addLiquidity(usdc_address, dai_address, amountA, amountB, amountAmin, amountBmin, impersonator_address, deadline);
    await addLiquidity.wait()
    console.log("LIQUIDITY ADDED SUCCESSFULLY")
  }catch{ console.log("FAILED TO ADD LIQUIDITY")
  }

    console.log("Cheching Balance")

    console.log(" USDC Balance", ethers.formatUnits (initialusdcbalance));
    console.log(" DAI Balance", ethers.formatUnits(initialdaibalance));
    console.log(" USDC Pool Balance", ethers.formatUnits(initialusdcpoolbalance));
    console.log(" DAU Pool Balance", ethers.formatUnits(initialdaipoolbalance));
    console.log(" Pool Balance", ethers.formatUnits(initialpoolbalance));




}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});