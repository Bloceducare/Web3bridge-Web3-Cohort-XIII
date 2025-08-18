import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
    const AssetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

    await helpers.impersonateAccount(AssetHolder);
    const impersonatedSigner = await ethers.getSigner(AssetHolder);

    // USDC contract Address
    const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    // DAI contract Address
    const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    // Uniswap V2 Router Address
    const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

    const USDC = await ethers.getContractAt("IERC20", USDCAddress);
    const DAI = await ethers.getContractAt("IERC20", DAIAddress);
    const Router = await ethers.getContractAt("IUniSwap", UNIRouter);

    const USDCBalance = await USDC.balanceOf(AssetHolder);
    const DAIBalance = await DAI.balanceOf(AssetHolder);

    console.log("####### Initial Balances #######");
    console.log("USDC Balance:", ethers.formatUnits(USDCBalance, 6));
    console.log("DAI Balance:", ethers.formatUnits(DAIBalance, 18));

    const amountOut = ethers.parseUnits("2000", 6);
    const amountInMax = ethers.parseUnits("2100", 18);
    const path = [USDCAddress, DAIAddress];
    const to = AssetHolder;
    const approvalUSDC = await USDC.connect(impersonatedSigner).approve(UNIRouter, amountInMax);

    console.log("Swap transaction approved");
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

    const swapTokensForExactToken = await Router.connect(impersonatedSigner).
    swapTokensForExactTokens(
        amountOut,
        amountInMax,
        path,
        to,
        deadline
    );

    const receipt = await swapTokensForExactToken.wait();

    console.log("Swap Transaction receipt");
    console.log("Block Hash:", receipt.blockHash);
    console.log("Block Number:", receipt.blockNumber);
    console.log("Gas Used:", receipt.gasUsed.toString());

    const usdcBal = await USDC.balanceOf(AssetHolder);
    const daiBal = await DAI.balanceOf(AssetHolder);

    const usdcBalAfter = ethers.formatUnits(usdcBal, 6);
    const daiBalAfter = ethers.formatUnits(daiBal, 18);

    console.log("USDC Balance after transaction", usdcBalAfter);
    console.log("DAI Balance after transaction", daiBalAfter);

}

main ()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });