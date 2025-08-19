import { ethers, version } from "hardhat";

async function main() {
  const impersonatedSigner = await ethers.getImpersonatedSigner(
    "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621"
  );

  const Router = await ethers.getContractAt(
    "IUniswapV2Router02",
    "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
  );

  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const ETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"

  const USDCcontract = await ethers.getContractAt("IERC20", USDCAddress);
  const DAIcontract = await ethers.getContractAt("IERC20", DAIAddress);

  const Factory = await ethers.getContractAt(
    "IUniswapV2Factory",
    "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"
  );

  const USDC_WETH_PAIR = await Factory.getPair(USDCAddress, ETHAddress);
  const USDC_WETH_PAIR_CONTRACT = await ethers.getContractAt(
    "IUniswapV2Pair",
    USDC_WETH_PAIR
  );

  let usdcBalance = ethers.formatUnits(
    await USDCcontract.connect(impersonatedSigner).balanceOf(
      impersonatedSigner
    ),
    6
  );
  const etherBalance = ethers.formatEther(
    await ethers.provider.getBalance(impersonatedSigner.address)
  );

  console.log("##################Balance before Adding liquidity ###############")
  console.log(usdcBalance);
  console.log(etherBalance);
  await USDCcontract.connect(impersonatedSigner).approve(
    Router,
    ethers.parseUnits("1000000", 6)
  );

  ///// ADD LIQUIDITY ///////////
  const addLiquidity = await Router.connect(impersonatedSigner).addLiquidityETH(
    USDCAddress,
    ethers.parseUnits("100000", 6), // amountTokenDesired
    ethers.parseUnits("0", 6),
    ethers.parseEther("0"),
    impersonatedSigner.address,
    Math.floor(Date.now() / 1000) + 60 * 10,
    {
      value: ethers.parseEther("100"),
    }
  );

  const newUSDCBalance = ethers.formatUnits(
    await USDCcontract.connect(impersonatedSigner).balanceOf(
      impersonatedSigner
    ),
    6
  );
  const newEtherBalance = ethers.formatEther(
    await ethers.provider.getBalance(impersonatedSigner)
  );


  console.log("################## BALANCES AFTER ADDING LIQUIDITY ##################");
  console.log("USDC Spent:", Number(usdcBalance) - Number(newUSDCBalance));
  console.log("ETH Spent:", Number(etherBalance) - Number(newEtherBalance));
  
  const lpBalance = await USDC_WETH_PAIR_CONTRACT.balanceOf(
    impersonatedSigner.address
  );

  await USDC_WETH_PAIR_CONTRACT.connect(impersonatedSigner).approve(Router,lpBalance);
  
    console.log("################## LIQUIDITY POSITION ##################");
  console.log("LP Tokens Received:", ethers.formatUnits(lpBalance, 18));



  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
  
  
  const removeLiquidity = await Router.connect(impersonatedSigner).removeLiquidityETH(
    USDCAddress,
    lpBalance,
    0,
    0,
    impersonatedSigner.address,
    deadline
  );

  const usdcBalanceAfter = ethers.formatUnits(
    await USDCcontract.balanceOf(impersonatedSigner),
    6
  );
  const etherBalanceAfter = ethers.formatEther(
    await ethers.provider.getBalance(impersonatedSigner)
  );


  console.log("################## BALANCES AFTER REMOVING LIQUIDITY ##################");
  console.log("USDC Returned:", Number(usdcBalanceAfter) - Number(newUSDCBalance));
  console.log("ETH Returned:", Number(etherBalanceAfter) - Number(newEtherBalance));

  const nonce = await USDC_WETH_PAIR_CONTRACT.nonces(impersonatedSigner.address);
  console.log(nonce);

  const domain =  {
    name: await USDC_WETH_PAIR_CONTRACT.name(),
    version: "1",
    chainId: (await ethers.provider.getNetwork()).chainId,
    verifyingContract: USDC_WETH_PAIR_CONTRACT.target.toString()
  }




 
}

main().catch((error) => {
  console.log(error);
});
