import { ethers } from "hardhat";

const whaleAddress = "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503";
const routerAddress = "0xf164fC0Ec4E93095b804a4795bBe1e041497b92a";
let pairAddress;
const usdtAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const daiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const factoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

async function addLiquidity() {
  const factoryContract = await ethers.getContractAt(
    "IUniswapV2Factory",
    factoryAddress
  );
  pairAddress = await factoryContract.getPair(usdtAddress, daiAddress);
  console.log(`Pair Address: ${pairAddress}`);
  const signer = await ethers.getImpersonatedSigner(whaleAddress);
  const [deployer] = await ethers.getSigners();

  console.log(
    `Whale's ETH balance before: ${ethers.formatEther(
      await ethers.provider.getBalance(await signer.getAddress())
    )}`
  );

  await deployer.sendTransaction({
    to: signer.address,
    value: ethers.parseEther("10"),
  });

  console.log(
    `Whale's ETH balance after: ${ethers.formatEther(
      await ethers.provider.getBalance(await signer.getAddress())
    )}`
  );

  const daiContract = await ethers.getContractAt("IERC20", daiAddress, signer);
  const routerContract = await ethers.getContractAt(
    "IUniswapV2Router01",
    routerAddress,
    signer
  );
  const usdtContract = await ethers.getContractAt(
    "IERC20",
    usdtAddress,
    signer
  );
  const pairContract = await ethers.getContractAt(
    "IUniswapV2Pair",
    pairAddress,
    signer
  );

  const whalesUsdtBalanceBeforeAdding = await usdtContract.balanceOf(
    await signer.getAddress()
  );
  const whalesDaiBalanceBeforeAdding = await daiContract.balanceOf(
    await signer.getAddress()
  );

  console.log(
    `USDT balance before adding liquidity: ${ethers.formatUnits(
      whalesUsdtBalanceBeforeAdding,
      6
    )}`
  );
  console.log(
    `DAI balance before adding liquidity: ${ethers.formatEther(
      whalesDaiBalanceBeforeAdding
    )}`
  );

  const UsdtInPoolBeforeAdding = await usdtContract.balanceOf(pairAddress);
  const DaiInPoolBeforeAdding = await daiContract.balanceOf(pairAddress);

  console.log(
    `USDT in pool before: ${ethers.formatUnits(UsdtInPoolBeforeAdding, 6)}`
  );
  console.log(
    `DAI in pool before: ${ethers.formatEther(DaiInPoolBeforeAdding)}`
  );

  const amountOfDaiToAddToPool = ethers.parseEther("10");
  const amountOfUsdtToAddToPool = ethers.parseUnits("10", 6);

  const minDaiAmount = (amountOfDaiToAddToPool * 95n) / 100n;
  const minUsdtAmount = (amountOfUsdtToAddToPool * 95n) / 100n;

  console.log(
    `Adding ${ethers.formatEther(
      amountOfDaiToAddToPool
    )} DAI and ${ethers.formatUnits(amountOfUsdtToAddToPool, 6)} USDT`
  );
  console.log(
    `Minimum amounts: ${ethers.formatEther(
      minDaiAmount
    )} DAI and ${ethers.formatUnits(minUsdtAmount, 6)} USDT`
  );

  await (
    await daiContract.approve(routerAddress, amountOfDaiToAddToPool)
  ).wait();
  await (
    await usdtContract.approve(routerAddress, amountOfUsdtToAddToPool)
  ).wait();

  await (
    await routerContract.addLiquidity(
      usdtAddress,
      daiAddress,
      amountOfUsdtToAddToPool,
      amountOfDaiToAddToPool,
      minUsdtAmount,
      minDaiAmount,
      signer.address,
      Math.ceil(Date.now() / 1000) + 300
    )
  ).wait();

  const UsdtInPoolAfterAdding = await usdtContract.balanceOf(pairAddress);
  const DaiInPoolAfterAdding = await daiContract.balanceOf(pairAddress);

  console.log(
    `USDT in pool after: ${ethers.formatUnits(UsdtInPoolAfterAdding, 6)}`
  );
  console.log(`DAI in pool after: ${ethers.formatEther(DaiInPoolAfterAdding)}`);

  const whalesUsdtBalanceAfterAdding = await usdtContract.balanceOf(
    await signer.getAddress()
  );
  const whalesDaiBalanceAfterAdding = await daiContract.balanceOf(
    await signer.getAddress()
  );

  console.log(
    `USDT balance after adding liquidity: ${ethers.formatUnits(
      whalesUsdtBalanceAfterAdding,
      6
    )}`
  );
  console.log(
    `DAI balance after adding liquidity: ${ethers.formatEther(
      whalesDaiBalanceAfterAdding
    )}`
  );

  console.log(
    `Actual DAI taken: ${ethers.formatEther(
      whalesDaiBalanceBeforeAdding - whalesDaiBalanceAfterAdding
    )}`
  );

  console.log(
    `Actual USDT taken: ${ethers.formatUnits(
      whalesUsdtBalanceBeforeAdding - whalesUsdtBalanceAfterAdding,
      6
    )}`
  );
}

async function removeLiquidity() {
  const factoryContract = await ethers.getContractAt(
    "IUniswapV2Factory",
    factoryAddress
  );
  pairAddress = await factoryContract.getPair(usdtAddress, daiAddress);
  console.log(`Pair Address: ${pairAddress}`);

  const signer = await ethers.getImpersonatedSigner(whaleAddress);
  const [deployer] = await ethers.getSigners();

  console.log(
    `Whale's ETH balance before: ${ethers.formatEther(
      await ethers.provider.getBalance(await signer.getAddress())
    )}`
  );

  await deployer.sendTransaction({
    to: signer.address,
    value: ethers.parseEther("10"),
  });

  console.log(
    `Whale's ETH balance after: ${ethers.formatEther(
      await ethers.provider.getBalance(await signer.getAddress())
    )}`
  );

  const daiContract = await ethers.getContractAt("IERC20", daiAddress, signer);
  const routerContract = await ethers.getContractAt(
    "IUniswapV2Router01",
    routerAddress,
    signer
  );
  const usdtContract = await ethers.getContractAt(
    "IERC20",
    usdtAddress,
    signer
  );
  const pairContract = await ethers.getContractAt(
    "IUniswapV2Pair",
    pairAddress,
    signer
  );

  const whalesUsdtBalanceBeforeRemoving = await usdtContract.balanceOf(
    await signer.getAddress()
  );
  const whalesDaiBalanceBeforeRemoving = await daiContract.balanceOf(
    await signer.getAddress()
  );

  console.log(
    `USDT balance before removing liquidity: ${ethers.formatUnits(
      whalesUsdtBalanceBeforeRemoving,
      6
    )}`
  );
  console.log(
    `DAI balance before removing liquidity: ${ethers.formatEther(
      whalesDaiBalanceBeforeRemoving
    )}`
  );

  const UsdtInPoolBeforeRemoving = await usdtContract.balanceOf(pairAddress);
  const DaiInPoolBeforeRemoving = await daiContract.balanceOf(pairAddress);

  console.log(
    `USDT in pool before: ${ethers.formatUnits(UsdtInPoolBeforeRemoving, 6)}`
  );
  console.log(
    `DAI in pool before: ${ethers.formatEther(DaiInPoolBeforeRemoving)}`
  );

  const lpTokenBalance = await pairContract.balanceOf(
    await signer.getAddress()
  );
  console.log(`LP token balance: ${ethers.formatEther(lpTokenBalance)}`);

  const liquidityToRemove = lpTokenBalance / 2n;

  const minUsdtAmount = ethers.parseUnits("4.75", 6); 
  const minDaiAmount = ethers.parseEther("4.75"); 

  console.log(`Removing ${ethers.formatEther(liquidityToRemove)} LP tokens`);
  console.log(
    `Minimum amounts: ${ethers.formatEther(
      minDaiAmount
    )} DAI and ${ethers.formatUnits(minUsdtAmount, 6)} USDT`
  );

  await (await pairContract.approve(routerAddress, liquidityToRemove)).wait();

  await (
    await routerContract.removeLiquidity(
      usdtAddress,
      daiAddress,
      liquidityToRemove,
      minUsdtAmount,
      minDaiAmount,
      signer.address,
      Math.ceil(Date.now() / 1000) + 300
    )
  ).wait();

  const UsdtInPoolAfterRemoving = await usdtContract.balanceOf(pairAddress);
  const DaiInPoolAfterRemoving = await daiContract.balanceOf(pairAddress);

  console.log(
    `USDT in pool after: ${ethers.formatUnits(UsdtInPoolAfterRemoving, 6)}`
  );
  console.log(
    `DAI in pool after: ${ethers.formatEther(DaiInPoolAfterRemoving)}`
  );

  const whalesUsdtBalanceAfterRemoving = await usdtContract.balanceOf(
    await signer.getAddress()
  );
  const whalesDaiBalanceAfterRemoving = await daiContract.balanceOf(
    await signer.getAddress()
  );

  console.log(
    `USDT balance after removing liquidity: ${ethers.formatUnits(
      whalesUsdtBalanceAfterRemoving,
      6
    )}`
  );
  console.log(
    `DAI balance after removing liquidity: ${ethers.formatEther(
      whalesDaiBalanceAfterRemoving
    )}`
  );

  console.log(
    `Actual DAI received: ${ethers.formatEther(
      whalesDaiBalanceAfterRemoving - whalesDaiBalanceBeforeRemoving
    )}`
  );

  console.log(
    `Actual USDT received: ${ethers.formatUnits(
      whalesUsdtBalanceAfterRemoving - whalesUsdtBalanceBeforeRemoving,
      6
    )}`
  );

  const remainingLpTokenBalance = await pairContract.balanceOf(
    await signer.getAddress()
  );
  console.log(
    `Remaining LP token balance: ${ethers.formatEther(remainingLpTokenBalance)}`
  );
}

async function main() {
  console.log("========== ADDING LIQUIDITY ==========");
  await addLiquidity();

  console.log("\n========== REMOVING LIQUIDITY ==========");
  await removeLiquidity();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
