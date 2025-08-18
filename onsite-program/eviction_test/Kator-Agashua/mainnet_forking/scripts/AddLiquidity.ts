import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

async function main() {
  const assetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621"; // Asset holder address

  // Impersonate the asset holder account
  await helpers.impersonateAccount(assetHolder);
  const assetHolderSigner = await ethers.getSigner(assetHolder);
  // console.log(assetHolderSigner);

  // USDT contract address (mainnet)
  const USDTAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
  const USDT = await ethers.getContractAt("IERC20", USDTAddress);

  // Dai contract address (mainnet)
  const DaiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const Dai = await ethers.getContractAt("IERC20", DaiAddress);

  const UniSwapV2RouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap V2 Router address
  const UniSwapV2Router = await ethers.getContractAt(
    "IUniswapV2Router02",
    UniSwapV2RouterAddress
  );

  // Log the Pre-Liquidity balance of USDT and Dai for the asset holder
  const USDTBalance = await USDT.balanceOf(assetHolder);
  const DaiBalance = await Dai.balanceOf(assetHolder);

  console.log(`################# Pre Liquidity #################`, `\n`);

  console.log(`USDT Balance: ${ethers.formatUnits(USDTBalance, 6)}`);
  console.log(`Dai Balance: ${ethers.formatUnits(DaiBalance, 18)}`);

  // console.log(assetHolderSigner);
  //   console.log(Dai);

  await USDT.connect(assetHolderSigner).approve(UniSwapV2Router.target, 0);
  const USDTApproved = await USDT.connect(assetHolderSigner).approve(
    UniSwapV2Router.target,
    ethers.parseUnits("4100000", 6)
  );

  const DaiApproved = await Dai.connect(assetHolderSigner).approve(
    UniSwapV2Router.target,
    ethers.parseUnits("400000", 18)
  );

  await USDTApproved.wait();
  await DaiApproved.wait();

  const deadline = Math.floor(new Date().getTime() / 1000) + 60 * 20; // 20 minutes from now
  const addLiquidity = await UniSwapV2Router.connect(
    assetHolderSigner
  ).addLiquidity(
    USDTAddress,
    DaiAddress,
    ethers.parseUnits("400000", 6),
    ethers.parseUnits("400000", 18),
    1,
    1,
    assetHolderSigner.address,
    deadline
  );
  await addLiquidity.wait();

  console.log(`################# Post Liquidity #################`, `\n`);

  const USDTBalancePostLiquidity = await USDT.balanceOf(assetHolder);
  const DaiBalancePostLiquidity = await Dai.balanceOf(assetHolder);

  console.log(
    `USDT Balance: ${ethers.formatUnits(USDTBalancePostLiquidity, 6)}`
  );
  console.log(
    `Dai Balance: ${ethers.formatUnits(DaiBalancePostLiquidity, 18)}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
