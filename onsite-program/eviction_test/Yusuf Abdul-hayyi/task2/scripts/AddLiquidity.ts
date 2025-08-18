import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

const main = async () => {
    // Address of the asset holder
    const AssetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

    // Address of the assets to be added
    const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC address
    const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // WETH address

    // Address of UNISwap V2 Router and pool address
    const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap V2 Router address
    const WETH_USDC_Pool = "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc"; // WETH/USDC Pool address

    // Impersonating the assetHolder and using ethers to get signature 
    //await helpers.impersonateAccount(AssetHolder);
    const signer = await ethers.getImpersonatedSigner(AssetHolder);
    await helpers.setBalance(AssetHolder, ethers.parseEther("10"));

    // Getting contract Instances and 

    const USDC_Contract = await ethers.getContractAt("IERC20", USDC);
    const WETH_Contract = await ethers.getContractAt("IERC20", WETH);
    const uniswapRouter = await ethers.getContractAt("IUniswapV2Router01", UNIRouter);
    const wethUsdcPool = await ethers.getContractAt("IUniswapV2Pair", WETH_USDC_Pool);

    // Getting the initial balance of the pairs

    const usdcBalance = await USDC_Contract.balanceOf(AssetHolder);
    const wethBalance = await WETH_Contract.balanceOf(AssetHolder);
    const poolBalance = await wethUsdcPool.balanceOf(AssetHolder);

    // Console logging the initial pair balances

    console.log("################### GET TOKEN BALANCE OF ASSETHOLDER ###################");

    console.log("USDC Balance:", ethers.formatUnits(usdcBalance.toString(), 6));
    console.log("WETH Balance:", ethers.formatUnits(wethBalance.toString(), 18));
    console.log("WETH/USDC Pool Balance:", ethers.formatUnits(poolBalance.toString(), 18));

    //  Allowance and Approval token to spend 
    const UsdcAmount = ethers.parseUnits("2000000", 6);
    const WethAmount = ethers.parseUnits("12", 18);

    const UsdcApproval = await USDC_Contract.connect(signer).approve(UNIRouter, UsdcAmount);
    const WethApproval = await WETH_Contract.connect(signer).approve(UNIRouter, WethAmount);

    const usdcTx = await UsdcApproval.wait();
    const wethTx = await WethApproval.wait();

    // Getting the transaction receipt
    console.log("################### ALLOWANCE AND APPROVAL OF TOKENS ###################");
    console.log("USDC Approval Transaction:", usdcTx);
    console.log("WETH Approval Transaction:", wethTx);

    // Adding liquidity to the pool 
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

    const addLiquidity = await uniswapRouter.connect(signer).addLiquidity(
        WETH,
        USDC,
        WethAmount,
        UsdcAmount,
        2,
        2,
        signer.address,
        deadline
    )

    const addLiquidityTx = await addLiquidity.wait();

    console.log("################### ADD LIQUIDITY ###################");
    console.log("Add Liquidity Transaction:", addLiquidityTx);

    // Getting the final token balances

    const finalUsdcBalance = await USDC_Contract.balanceOf(AssetHolder);
    const finalWethBalance = await WETH_Contract.balanceOf(AssetHolder);
    const lpBalance = await wethUsdcPool.balanceOf(AssetHolder);

    console.log("################### GET FINAL TOKEN BALANCE OF ASSETHOLDER ###################");

    console.log("Final USDC Balance:", ethers.formatUnits(finalUsdcBalance.toString(), 6));
    console.log("Final WETH Balance:", ethers.formatUnits(finalWethBalance.toString(), 18));
    console.log("Final WETH/USDC LP Token Balance:", ethers.formatUnits(lpBalance.toString(), 18));
    // Getting the pool tokens and reserves
    const token0 = await wethUsdcPool.token0();
    const token1 = await wethUsdcPool.token1();
    const [reserve0, reserve1] = await wethUsdcPool.getReserves();

    console.log("################### POOL RESERVES ###################");
    console.log("Token0:", token0, "Reserve0:", reserve0.toString());
    console.log("Token1:", token1, "Reserve1:", reserve1.toString());

}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
