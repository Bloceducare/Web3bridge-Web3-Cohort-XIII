import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
    const FeeTokenAddress = "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE";
    const UniSwapRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const FeeTokenHolder = "0x28C6c06298d514Db089934071355E5743bf21d60";
    const FEE_TOKEN_ETH_PAIR = "0x4d5ef58aAc27d99935E5b6B4A6778ff292059991";

    await helpers.impersonateAccount(FeeTokenHolder);
    const impersonatedSigner = await ethers.getSigner(FeeTokenHolder);

    const liquidityAmount = ethers.parseEther("0.1");
    const amountTokenMin = ethers.parseEther("100");
    const amountETHMin = ethers.parseEther("0.01");
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

    const FeeToken = await ethers.getContractAt("IERC20", FeeTokenAddress, impersonatedSigner);
    const ROUTER = await ethers.getContractAt("IUniswapV2Router", UniSwapRouter, impersonatedSigner);
    const lpContract = await ethers.getContractAt("IERC20", FEE_TOKEN_ETH_PAIR, impersonatedSigner);

    const tokenBefore = await FeeToken.balanceOf(impersonatedSigner.getAddress());
    const ethBalBefore = await ethers.provider.getBalance(impersonatedSigner.getAddress());
    const lpBalBefore = await lpContract.balanceOf(impersonatedSigner.getAddress());

    console.log("Balance before removing liquidity:::", "FeeToken:::", Number(tokenBefore), "ETH:::", Number(ethBalBefore));
    console.log("LP Balance before removing liquidity:::", "LP:::", Number(lpBalBefore));

    await lpContract.approve(UniSwapRouter, liquidityAmount);

    const tx = await ROUTER.removeLiquidityETHSupportingFeeOnTransferTokens(
        FeeTokenAddress,
        liquidityAmount,
        amountTokenMin,
        amountETHMin,
        impersonatedSigner.getAddress(),
        deadline
    );

    await tx.wait();

    const tokenAfter = await FeeToken.balanceOf(impersonatedSigner.getAddress());
    const ethBalAfter = await ethers.provider.getBalance(impersonatedSigner.getAddress());
    const lpBalAfter = await lpContract.balanceOf(impersonatedSigner.getAddress());

    console.log("Balance after removing liquidity:::", "FeeToken:::", Number(tokenAfter), "ETH:::", Number(ethBalAfter));
    console.log("LP Balance after removing liquidity:::", "LP:::", Number(lpBalAfter));

    console.log("=========================================================");
    console.log("FeeToken gained:", ethers.formatEther(tokenAfter - tokenBefore));
    console.log("ETH gained:", ethers.formatEther(ethBalAfter - ethBalBefore));
    console.log("LP tokens used:", ethers.formatEther(lpBalBefore - lpBalAfter));
    console.log("=========================================================");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
