
import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const main = async () => {
  const DAIAddress = "0x71bE63f3384f5fb98995898A86B02Fb2426c5788 ";  
  const wethAddress = "00xFABB0ac9d68B0B445fB7357272Ff202C5651694a";

  const UNIRouter = "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec ";

  const USDCHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await helpers.impersonateAccount(USDCHolder);
  const impersonatedSigner = await ethers.getSigner(USDCHolder);

  const DAI = await ethers.getContractAt("IERC20", DAIAddress);
  const WETH = await ethers.getContractAt("IERC20", wethAddress);
  const ROUTER = await ethers.getContractAt("IUniswapV2Router02", UNIRouter);

  console.log("Get address Uniswap Router...");
  const factoryAddress = await ROUTER.factory();
  const factory = await ethers.getContractAt("IUniswapV2Factory", factoryAddress);

  const pairAddress = await factory.getPair(DAIAddress, wethAddress);
  const LPToken = await ethers.getContractAt("IERC20", pairAddress);

  console.log("Get Token Balance...");
  const daiBalanceBefore = await DAI.balanceOf(impersonatedSigner.address);
  const ethBalanceBefore = await impersonatedSigner.provider.getBalance(impersonatedSigner.address);
 
  console.log("DAI Balance Before:", ethers.formatUnits(daiBalanceBefore, 18));
  console.log("ETH Balance Before:", ethers.formatUnits(ethBalanceBefore, 18));

  const liquidityBF = await LPToken.balanceOf(impersonatedSigner.address);
  console.log("Liquidity Token bal before Burn:", liquidityBF);


  console.log("Approve LP tokens to be burnt");

  await LPToken.connect(impersonatedSigner).approve(UNIRouter, liquidityBF);


  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  console.log("Removing Liquidity . . . . . .");

  const tx = await ROUTER.connect(impersonatedSigner).removeLiquidityETH(
    DAIAddress,
    liquidityBF,
    0,
    0,
    impersonatedSigner.address,
    deadline
  );
  await tx.wait();

  console.log("removeLiquidityETH executed at:", tx.hash);

   const daiBalanceAfter = await DAI.balanceOf(impersonatedSigner.address);
   const ethBalanceAfter = await impersonatedSigner.provider.getBalance(impersonatedSigner.address);
 
   console.log("DAI Balance After:", ethers.formatUnits(daiBalanceAfter, 18));
   console.log("ETH Balance After:", ethers.formatUnits(ethBalanceAfter, 18));

  const liquidityAF = await LPToken.balanceOf(impersonatedSigner.address);

  console.log("Liquidity Token Balance AF Burn:", liquidityAF);

};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
