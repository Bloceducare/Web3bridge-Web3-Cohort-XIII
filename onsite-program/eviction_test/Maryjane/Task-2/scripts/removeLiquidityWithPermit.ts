import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
    const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const UniSwapRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const USDCHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";
    const ETH_USDC_PAIR = "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc";

    await helpers.impersonateAccount(USDCHolder);
    const impersonatedSigner = await ethers.getSigner(USDCHolder);

    const liquidityAmount = ethers.parseEther("0.1");
    const amountUSDCMin = ethers.parseUnits("50", 6);
    const amountETHMin = ethers.parseEther("0.01");
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

    const USDC = await ethers.getContractAt("IERC20", USDCAddress, impersonatedSigner);
    const ROUTER = await ethers.getContractAt("IUniswapV2Router", UniSwapRouter, impersonatedSigner);
    const lpContract = await ethers.getContractAt("IUniswapV2Pair", ETH_USDC_PAIR, impersonatedSigner);

    const usdcBefore = await USDC.balanceOf(impersonatedSigner.getAddress());
    const ethBalBefore = await ethers.provider.getBalance(impersonatedSigner.getAddress());
    const lpBalBefore = await lpContract.balanceOf(impersonatedSigner.getAddress());

    console.log("Balance before removing liquidity:::", "USDC:::", Number(usdcBefore), "ETH:::", Number(ethBalBefore));
    console.log("LP Balance before removing liquidity:::", "LP:::", Number(lpBalBefore));

    const nonce = await lpContract.nonces(impersonatedSigner.getAddress());
    const name = await lpContract.name();
    const version = "1";
    const chainId = await impersonatedSigner.getChainId();

    const domain = {
        name: name,
        version: version,
        chainId: chainId,
        verifyingContract: ETH_USDC_PAIR
    };

    const types = {
        Permit: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
            { name: "value", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" }
        ]
    };

    const values = {
        owner: await impersonatedSigner.getAddress(),
        spender: UniSwapRouter,
        value: liquidityAmount,
        nonce: nonce,
        deadline: deadline
    };

    const signature = await impersonatedSigner._signTypedData(domain, types, values);
    const { v, r, s } = ethers.utils.splitSignature(signature);

    const tx = await ROUTER.removeLiquidityWithPermit(
        USDCAddress,
        WETHAddress,
        liquidityAmount,
        amountUSDCMin,
        amountETHMin,
        impersonatedSigner.getAddress(),
        deadline,
        false,
        v,
        r,
        s
    );

    await tx.wait();

    const usdcAfter = await USDC.balanceOf(impersonatedSigner.getAddress());
    const ethBalAfter = await ethers.provider.getBalance(impersonatedSigner.getAddress());
    const lpBalAfter = await lpContract.balanceOf(impersonatedSigner.getAddress());

    console.log("Balance after removing liquidity:::", "USDC:::", Number(usdcAfter), "ETH:::", Number(ethBalAfter));
    console.log("LP Balance after removing liquidity:::", "LP:::", Number(lpBalAfter));

    console.log("=========================================================");
    console.log("USDC gained:", ethers.formatUnits(usdcAfter - usdcBefore, 6));
    console.log("ETH gained:", ethers.formatEther(ethBalAfter - ethBalBefore));
    console.log("LP tokens used:", ethers.formatEther(lpBalBefore - lpBalAfter));
    console.log("=========================================================");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
