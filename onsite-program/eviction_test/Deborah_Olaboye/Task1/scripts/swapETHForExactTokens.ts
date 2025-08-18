import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
    const AssetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

    await helpers.impersonateAccount(AssetHolder);
    const impersonatedSigner = await ethers.getSigner(AssetHolder);

    const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const WETH_Address = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

    const USDC = await ethers.getContractAt("IERC20", USDCAddress);
    const WETH = await ethers.getContractAt("IERC20", WETH_Address);
    const Router = await ethers.getContractAt("IUniSwap", UNIRouter);

    const USDCBalance = await USDC.balanceOf(AssetHolder);
    const WETHBalance = await WETH.balanceOf(AssetHolder);

    console.log("####### Initial Balances #######");
    console.log("USDC Balance:", ethers.formatUnits(USDCBalance, 6));
    console.log("WETH Balance:", ethers.formatUnits(WETHBalance, 18));

    const amountOut = ethers.parseUnits("2000", 6);
    const amountInMax = ethers.parseEther("2");

    console.log("Target USDC amount:", ethers.formatUnits(amountOut.toString(), 6));

    const path = [WETH_Address, USDCAddress];
    const to = AssetHolder;

    console.log("Swap transaction approved");
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

    const swapTokensForExactToken = await Router.connect(impersonatedSigner).swapETHForExactTokens(
        amountOut,
        path,
        to,
        deadline,
        { value: amountInMax }
    );

    const receipt = await swapTokensForExactToken.wait();

    console.log("Swap Transaction receipt");
    console.log("Block Hash:", receipt.blockHash);
    console.log("Block Number:", receipt.blockNumber);
    console.log("Gas Used:", receipt.gasUsed.toString());

    const usdcBal = await USDC.balanceOf(AssetHolder);
    const wethBal = await WETH.balanceOf(AssetHolder);

    const usdcBalAfter = ethers.formatUnits(usdcBal, 6);
    const wethBalAfter = ethers.formatUnits(wethBal, 18);

    console.log("USDC Balance after transaction", usdcBalAfter);
    console.log("ETH Balance after transaction", wethBalAfter);
    console.log("Swap transaction completed");

}

main ()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });