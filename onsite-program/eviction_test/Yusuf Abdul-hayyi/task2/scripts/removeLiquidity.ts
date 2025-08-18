import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

const main = async () => {
    const AssetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

    const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const USDC_WETH_POOL = "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc";

    const signer = await ethers.getImpersonatedSigner(AssetHolder);
    await helpers.setBalance(AssetHolder, ethers.parseEther("10"));

    // Getting the contract instances

    const USDC_Contract = await ethers.getContractAt("IERC20", USDC);
    const WETH_Contract = await ethers.getContractAt("IERC20", WETH);
    const uniswapRouter = await ethers.getContractAt("IUniswapV2Router01", UNIRouter);
    const wethUsdcPool = await ethers.getContractAt("IUniswapV2Pair", USDC_WETH_POOL);


    const usdcBalance = await USDC_Contract.balanceOf(AssetHolder);
    const wethBalance = await WETH_Contract.balanceOf(AssetHolder);
    const poolBalance = await wethUsdcPool.balanceOf(AssetHolder);

    console.log("########### Initial Balance ################")

    console.log("USDC Balance:", ethers.formatUnits(usdcBalance.toString(), 6));
    console.log("WETH Balance:", ethers.formatUnits(wethBalance.toString(), 18));
    console.log("WETH/USDC Pool Balance:", ethers.formatUnits(poolBalance.toString(), 18));

    //  Allowance and Approval token to spend 
    const UsdcAmount = ethers.parseUnits("2000000", 6);
    const WethAmount = ethers.parseUnits("23", 18);

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
    // 
    const addLiquidity = await uniswapRouter.connect(signer).addLiquidity(
        USDC,
        WETH,
        UsdcAmount,
        WethAmount,
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


    const Amount = await wethUsdcPool.balanceOf(AssetHolder);
    // const Amount_LP = parseFloat(ethers.formatUnits(Amount.toString(), 18)) * 0.5;

    // const Amount_removed = ethers.parseUnits(Amount_LP.toFixed(2), 18);

    await wethUsdcPool.connect(signer).approve(UNIRouter, Amount); 

    const removeLiquidity = await uniswapRouter.connect(signer).removeLiquidity(
        WETH,
        USDC,
        Amount,
        1,
        1,
        signer.address,
        deadline
    )
    const removeLiquidityTx = await removeLiquidity.wait();

    console.log("######### Removev Liquidity #######")

    console.log("Removed Liquidity", removeLiquidityTx)

    const updatedUsdcBalance = await USDC_Contract.balanceOf(AssetHolder);
    const updatedWetheBalance = await WETH_Contract.balanceOf(AssetHolder);
    const updatedPool = await wethUsdcPool.balanceOf(AssetHolder);

    console.log("Current USDC Balance", ethers.formatUnits(updatedUsdcBalance.toString(), 6));
    console.log("Current WETH Balance", ethers.formatUnits(updatedWetheBalance.toString(), 18));
    console.log("Current Lp tokens in pool", ethers.formatUnits(updatedPool.toString(), 18));
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

