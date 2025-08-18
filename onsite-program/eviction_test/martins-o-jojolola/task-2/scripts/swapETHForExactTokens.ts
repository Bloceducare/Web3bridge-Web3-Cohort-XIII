import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const main = async () => {
    const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const ROUTER_ADDR = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

    const testAccount = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

    console.log("Impersonating:", testAccount);
    await helpers.impersonateAccount(testAccount);
    await helpers.setBalance(testAccount, ethers.parseEther("1000"));
    const signer = await ethers.getSigner(testAccount);

    const router = await ethers.getContractAt("IUniswapV2Router02", ROUTER_ADDR);

    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

    console.log("Swapping 1 ETH → DAI...");
    const tx = await router.connect(signer).swapExactETHForTokens(
        0,
        [WETH, DAI],
        signer.address,
        deadline,
        { value: ethers.parseEther("1") }
    );

    const receipt = await tx.wait();
    console.log("✅ Swap complete");
    console.log("Tx hash:", receipt.hash);

    const dai = await ethers.getContractAt("IERC20", DAI);
    const balance = await dai.balanceOf(signer.address);
    console.log("DAI Balance after swap:", ethers.formatUnits(balance, 18));
};

main().catch((err) => {
    console.error("Error:", err);
    process.exitCode = 1;
});
