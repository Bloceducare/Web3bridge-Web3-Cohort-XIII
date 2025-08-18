import {ethers} from "hardhat";

const helpers= require ("@nomicfoundation/hardhat-network-helpers")


async function swapExactETHForTokens(){
     const AssetHolder="0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";
     await helpers.impersonateAccount(AssetHolder);
     const impersonateSigner= await ethers.getSigner(AssetHolder);

     const USDCAddress= "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
     const WETHAddress= "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
     const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

     const USDC= await ethers.getContractAt("IERC20",USDCAddress);

     const usdcbalbefore = await USDC.balanceOf(AssetHolder);
     const ethbalbefore= await ethers.provider.getBalance(AssetHolder);
     console.log("###########################Initial account info#############################")
     console.log("Initial usdc:",ethers.formatUnits(usdcbalbefore.toString(),6));
     console.log("Initial eth:", ethers.formatEther(ethbalbefore))

    const Router= await ethers.getContractAt("IUniSwap", UNIRouter);
    const amountOutMin= ethers.parseUnits("3000",6);
    const path= [WETHAddress,USDCAddress];
    const amountsOut= await Router.getAmountsOut(ethers.parseEther("0.9"),path);
    const amountOfUsdc= amountsOut[1];
    const deadLine= Math.floor(Date.now()/1000)+60 * 8;

    console.log("you will get this amount of usdc with 0.9eth:", ethers.formatUnits(amountOfUsdc,6))

    //const slippageBuffer= amountOfUsdc*BigInt(95)/BigInt(100);

    await Router.connect(impersonateSigner).swapExactETHForTokens(amountOutMin,path,impersonateSigner.address,deadLine,{value: ethers.parseEther("0.9")});
    const usdcbalafter= await USDC.balanceOf(AssetHolder);
    const ethbalanceafter= await ethers.provider.getBalance(AssetHolder);
   console.log("##################### Final account info #########################")
    console.log("Final usdc balance:", ethers.formatUnits(usdcbalafter.toString(),6));
    console.log("Final eth balance:", ethers.formatEther(ethbalanceafter));
    
}
swapExactETHForTokens().catch((error)=>{
    console.error(error);
    process.exitCode=1;
})