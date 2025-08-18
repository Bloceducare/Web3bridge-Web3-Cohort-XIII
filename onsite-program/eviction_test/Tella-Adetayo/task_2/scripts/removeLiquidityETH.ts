import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const main = async () => {
  const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  const USDCHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await helpers.impersonateAccount(USDCHolder);
  const impersonatedSigner = await ethers.getSigner(USDCHolder);

  const DAI = await ethers.getContractAt("IERC20", DAIAddress);
  const ROUTER = await ethers.getContractAt("IUniswapV2Router02", UNIRouter);

  const factoryAddress = await ROUTER.factory();
  const factory = await ethers.getContractAt("IUniswapV2Factory", factoryAddress);
  const pairAddress = await factory.getPair(DAIAddress, wethAddress);
  const LPToken = await ethers.getContractAt("IERC20", pairAddress);

  const daiBalanceBefore = await DAI.balanceOf(impersonatedSigner.address);
  const ethBalanceBefore = await impersonatedSigner.provider.getBalance(impersonatedSigner.address);

  console.log("DAI Balance Before:", ethers.formatUnits(daiBalanceBefore, 18));
  console.log("ETH Balance Before:", ethers.formatUnits(ethBalanceBefore, 18));

  // Approve router to spend DAI
  await DAI.connect(impersonatedSigner).approve(UNIRouter, ethers.MaxUint256);

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  // -------- Add Liquidity (DAI + ETH) ----------
  const addTx = await ROUTER.connect(impersonatedSigner).addLiquidityETH(
    DAIAddress,
    ethers.parseUnits("1000", 18),   // 1000 DAI
    0,
    0,
    impersonatedSigner.address,
    deadline,
    { value: ethers.parseEther("5") } // 5 ETH
  );
  await addTx.wait();
  console.log("Liquidity added at:", addTx.hash);

  const lpBalAfterAdd = await LPToken.balanceOf(impersonatedSigner.address);
  console.log("LP Tokens after adding liquidity:", lpBalAfterAdd);

  // -------- Remove Liquidity ----------
  await LPToken.connect(impersonatedSigner).approve(UNIRouter, lpBalAfterAdd);

  const removeTx = await ROUTER.connect(impersonatedSigner).removeLiquidityETH(
    DAIAddress,
    lpBalAfterAdd,
    0,
    0,
    impersonatedSigner.address,
    deadline
  );
  await removeTx.wait();
  console.log("Liquidity removed at:", removeTx.hash);

  const daiBalanceAfter = await DAI.balanceOf(impersonatedSigner.address);
  const ethBalanceAfter = await impersonatedSigner.provider.getBalance(impersonatedSigner.address);
  const lpBalFinal = await LPToken.balanceOf(impersonatedSigner.address);

  console.log("DAI Balance After:", ethers.formatUnits(daiBalanceAfter, 18));
  console.log("ETH Balance After:", ethers.formatUnits(ethBalanceAfter, 18));
  console.log("LP Token Balance After Burn:", lpBalFinal);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
