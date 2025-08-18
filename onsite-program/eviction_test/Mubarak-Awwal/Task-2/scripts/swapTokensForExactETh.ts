import {ethers} from "hardhat";
const helpers= require ("@nomicfoundation/hardhat-network-helpers")


async function swapTokensforExactEth(){
     const AssetHolder="0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";
     await helpers.impersonateAccount(AssetHolder);
     const impersonateSigner= await ethers.getSigner(AssetHolder);

     const USDCAddress= "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
     const WETHAddress= "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
     const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

     const USDC= await ethers.getContractAt("IERC20",USDCAddress);
    
     const usdcbal= await USDC.balanceOf(AssetHolder);
     const ethbal= await ethers.provider.getBalance(AssetHolder);

     console.log("##################### Initial account info #####################")
     console.log("Usdc balance before swap:", ethers.formatUnits(usdcbal.toString(),6));
     console.log("Eth balance before swap:", ethers.formatEther(ethbal));
    
     const amountOut= ethers.parseEther("0.2");
     const amountInMax=ethers.parseUnits("1000",6);
     const deadLine=Math.floor(Date.now()/1000)+60*10;
     const Router= await ethers.getContractAt("IUniSwap", UNIRouter);

     await USDC.connect(impersonateSigner).approve(UNIRouter,amountInMax);
     await Router.connect(impersonateSigner).swapTokensForExactETH(amountOut,amountInMax,[USDCAddress,WETHAddress],impersonateSigner.address,deadLine);
    const usdcbalafter= await USDC.balanceOf(AssetHolder);
    const ethbalanceafter= await ethers.provider.getBalance(AssetHolder);

     console.log("################### Final account info #########################")

      console.log("final usdc balance after swapping:", ethers.formatUnits(usdcbalafter.toString(),6));
      console.log("final eth balance after swapping:", ethers.formatEther(ethbalanceafter));
}
swapTokensforExactEth().catch((error)=>{
    console.error(error);
    process.exitCode=1;
})