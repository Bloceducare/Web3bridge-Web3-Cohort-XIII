import {ethers} from "hardhat";

const helpers= require ("@nomicfoundation/hardhat-network-helpers")


async function swapEthforexacttokens(){
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

     const amountOut= ethers.parseUnits("30000",6);
     const path=[WETHAddress,USDCAddress];
     const deadLine= Math.floor(Date.now()/1000)+60 *10;

    const amountsIn= await Router.getAmountsIn(amountOut,path);
    const requiredEth= amountsIn[0];
    console.log("Required Eth for 30000 USDC:", ethers.formatEther(requiredEth));

    const slippageBuffer= requiredEth * BigInt(110)/BigInt(100);

    await Router.connect(impersonateSigner).swapETHForExactTokens(amountOut,path,impersonateSigner.address,deadLine,{value:slippageBuffer});
    const usdcbalafter= await USDC.balanceOf(AssetHolder);
    const ethbalanceafter= await ethers.provider.getBalance(AssetHolder);
   console.log("##################### Final account info #########################")
    console.log("Final usdc balance:", ethers.formatUnits(usdcbalafter.toString(),6));
    console.log("Final eth balance:", ethers.formatEther(ethbalanceafter));

}
swapEthforexacttokens().catch((error)=>{
    console.log(error);
    process.exitCode=1;
})