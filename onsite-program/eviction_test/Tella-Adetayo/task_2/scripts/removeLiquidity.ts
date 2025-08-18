import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const main = async () => {
  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  const USDCHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  // Impersonate impersonator 
  await helpers.impersonateAccount(USDCHolder);
  const impersonatedSigner = await ethers.getSigner(USDCHolder);

  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const DAI = await ethers.getContractAt("IERC20", DAIAddress);
  const ROUTER = await ethers.getContractAt("IUniswapV2Router02", UNIRouter);

  console.log("Fetching Factory...");
  const factoryAddress = await ROUTER.factory();
  const factory = await ethers.getContractAt("IUniswapV2Factory", factoryAddress);

  const pairAddress = await factory.getPair(USDCAddress, DAIAddress);
  const LPToken = await ethers.getContractAt("IERC20", pairAddress);

  // Initial balances
  const usdcBalBefore = await USDC.balanceOf(impersonatedSigner.address);
  const daiBalBefore = await DAI.balanceOf(impersonatedSigner.address);
  console.log("USDC Balance Before:", ethers.formatUnits(usdcBalBefore, 6));
  console.log("DAI Balance Before:", ethers.formatUnits(daiBalBefore, 18));

  // Approve router for both tokens
  console.log("Approving USDC & DAI for Router...");
  await USDC.connect(impersonatedSigner).approve(UNIRouter, ethers.MaxUint256);
  await DAI.connect(impersonatedSigner).approve(UNIRouter, ethers.MaxUint256);

  // Add liquidity
  console.log("Adding Liquidity...");
  const amountADesired = ethers.parseUnits("1000", 6);  // 1000 USDC
  const amountBDesired = ethers.parseUnits("1000", 18); // 1000 DAI
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  const addTx = await ROUTER.connect(impersonatedSigner).addLiquidity(
    USDCAddress,
    DAIAddress,
    amountADesired,
    amountBDesired,
    0,
    0,
    impersonatedSigner.address,
    deadline
  );
  await addTx.wait();
  console.log("Liquidity Added at:", addTx.hash);

  const lpBalAfterAdd = await LPToken.balanceOf(impersonatedSigner.address);
  console.log("LP Token Balance After Adding Liquidity:", lpBalAfterAdd);

  // Approve LP tokens to be burnt
  console.log("Approving LP tokens for removal...");
  await LPToken.connect(impersonatedSigner).approve(UNIRouter, lpBalAfterAdd);

  // Remove liquidity
  console.log("Removing Liquidity...");
  const removeTx = await ROUTER.connect(impersonatedSigner).removeLiquidity(
    USDCAddress,
    DAIAddress,
    lpBalAfterAdd,
    0,
    0,
    impersonatedSigner.address,
    deadline
  );
  await removeTx.wait();
  console.log("Liquidity Removed at:", removeTx.hash);

  // Final balances
  const usdcBalAfter = await USDC.balanceOf(impersonatedSigner.address);
  const daiBalAfter = await DAI.balanceOf(impersonatedSigner.address);
  const lpBalFinal = await LPToken.balanceOf(impersonatedSigner.address);

  console.log("USDC Balance After:", ethers.formatUnits(usdcBalAfter, 6));
  console.log("DAI Balance After:", ethers.formatUnits(daiBalAfter, 18));
  console.log("LP Token Balance After Removal:", lpBalFinal);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
