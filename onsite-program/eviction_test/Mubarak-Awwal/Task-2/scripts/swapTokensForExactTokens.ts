import {ethers} from "hardhat";
const helpers= require ("@nomicfoundation/hardhat-network-helpers")


async function swapTokens(){
     const AssetHolder="0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";
     await helpers.impersonateAccount(AssetHolder);
     const impersonateSigner= await ethers.getSigner(AssetHolder);

     const USDCAddress= "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
     const DAIAddress= "0x6B175474E89094C44Da98b954EedeAC495271d0F";
     const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

     const USDC= await ethers.getContractAt("IERC20",USDCAddress);
     const DAI= await ethers.getContractAt("IERC20",DAIAddress);

     const usdcbal= await USDC.balanceOf(AssetHolder);
     const daibal= await DAI.balanceOf(AssetHolder);

     console.log("##################### Initial account info #####################")
     console.log("Usdc balance before swap:", ethers.formatUnits(usdcbal.toString(),6));
     console.log("Dai balance before swap:", ethers.formatUnits(daibal.toString(),18));
     

     const Router= await ethers.getContractAt("IUniSwap", UNIRouter);


     const amountOut= ethers.parseUnits("1000",18);
     const amountInMax= ethers.parseUnits("1050",6)
     await USDC.connect(impersonateSigner).approve(UNIRouter, amountInMax)
     const deadLine= Math.floor(Date.now()/1000)+60*10;

      await Router.connect(impersonateSigner).swapTokensForExactTokens(amountOut,amountInMax,[USDCAddress,DAIAddress],impersonateSigner.address,deadLine)


     const usdcbalafter= await USDC.balanceOf(AssetHolder);
     const daibalafter= await DAI.balanceOf(AssetHolder);
console.log("########################### Final account info#############################")
console.log("final usdc balance after swapping:", ethers.formatUnits(usdcbalafter.toString(),6));
 console.log("final dai balance after swapping:", ethers.formatUnits(daibalafter.toString(),18));
}
swapTokens().catch((error)=>{
    console.error(error);
    process.exitCode=1;
})