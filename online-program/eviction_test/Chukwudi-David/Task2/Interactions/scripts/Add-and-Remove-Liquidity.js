const { ethers } = require("hardhat");
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

async function main() {
    const USDTAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
   
  
    const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const UNIFactory = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
  
    const theAddressIFoundWithUSDTAndDAI = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

    await helpers.impersonateAccount(theAddressIFoundWithUSDTAndDAI);
    const impersonatedAccount = await ethers.getSigner(theAddressIFoundWithUSDTAndDAI);

    const UsdTContract = await ethers.getContractAt("IERC20", USDTAddress);
    const DaiContract = await ethers.getContractAt("IERC20", DAIAddress);

    const UniRouterContract = await ethers.getContractAt("IUniswap", UNIRouter);
    const Factory = await ethers.getContractAt("IUniswapV2Factory", UNIFactory);

    // Find the LP (pair) contract
    const pairAddress = await Factory.getPair(USDTAddress, DAIAddress);
    const Pair = await ethers.getContractAt("IERC20", pairAddress);

    let usdTBal = await UsdTContract.balanceOf(impersonatedAccount.address);
    let daiBal = await DaiContract.balanceOf(impersonatedAccount.address);


    console.log('impersonneted acct usdT bal BA:', ethers.formatUnits(usdTBal, 6))
    console.log("impersonneted acct dai bal BA:", ethers.formatUnits(daiBal, 18));

    console.log("----------------Approving USDT and DAI for the router-----------------");

    let AmountA = ethers.parseUnits("200000", 6);
    let AmountB = ethers.parseUnits("200000", 18);

    let AmountAMin = ethers.parseUnits("190000", 6);
    let AmountBMin = ethers.parseUnits("190000", 18);

    let dealine = await helpers.time.latest() + 600;

    await UsdTContract.connect(impersonatedAccount).approve(UniRouterContract, AmountA);
    await DaiContract.connect(impersonatedAccount).approve(UniRouterContract, AmountB);

    console.log("------------------Approval Done -----------------");

    console.log("----------------Adding Liquidity-----------------");

    await UniRouterContract.connect(impersonatedAccount).addLiquidity(
        USDTAddress,
        DAIAddress,
        AmountA, 
        AmountB,
        AmountAMin,
        AmountBMin,
        impersonatedAccount.address,
        dealine        
    )

    console.log("Liquidity Added Successfully");

    let usdTBalAfter = await UsdTContract.balanceOf(impersonatedAccount.address);
    let daiBalAfter = await DaiContract.balanceOf(impersonatedAccount.address);

    console.log('impersonneted acct usdT bal BA:', ethers.formatUnits(usdTBalAfter, 6))
    console.log("impersonneted acct dai bal BA:", ethers.formatUnits(daiBalAfter, 18));

    console.log("----------------Removing Liquidity-----------------");

      // 🔑 LP token balance
    let lpBal = await Pair.balanceOf(impersonatedAccount.address);
    console.log("LP token balance:", ethers.formatUnits(lpBal, 18));

    // Approve LP tokens to router
    await Pair.connect(impersonatedAccount).approve(UNIRouter, lpBal);

    await UniRouterContract.connect(impersonatedAccount).removeLiquidity(
        USDTAddress,
        DAIAddress,
        lpBal,
        AmountAMin,
        AmountBMin,
        impersonatedAccount.address,
        dealine        
    )

    console.log("Liquidity Removed Successfully");

    let usdTBalAfterRemoval = await UsdTContract.balanceOf(impersonatedAccount.address);
    let daiBalAfterRemoval = await DaiContract.balanceOf(impersonatedAccount.address);

    console.log('impersonneted acct usdT bal BA:', ethers.formatUnits(usdTBalAfterRemoval, 6))
    console.log("impersonneted acct dai bal BA:", ethers.formatUnits(daiBalAfterRemoval, 18));

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});