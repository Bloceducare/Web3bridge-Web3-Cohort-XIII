import { ethers } from "hardhat";

const whale = "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503";
const routerAddress = "0xf164fC0Ec4E93095b804a4795bBe1e041497b92a";
const factoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const usdtAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const daiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

async function swapTokensForExactTokens(amountOut: bigint) {
  const signer = await ethers.getImpersonatedSigner(whale);

  const factoryContract = await ethers.getContractAt(
    "IUniswapV2Factory",
    factoryAddress,
    signer
  );
  let pairPoolAddress = await factoryContract.getPair(usdtAddress, daiAddress);

  if (pairPoolAddress == ethers.ZeroAddress) {
    console.log("Pool does not exist for this pair");
    process.exitCode = 1;
    process.exit();
  }

  const [deployer] = await ethers.getSigners();
  const gasPrice = ethers.parseUnits("200", "gwei");
  await deployer.sendTransaction({
    to: signer.address,
    value: ethers.parseEther("5"),
    gasPrice,
  });

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
  const daiContract = await ethers.getContractAt("IERC20", daiAddress, signer);

  const balanceOfDaiBeforeSwap = await daiContract.balanceOf(signer.address);
  const balanceOfUsdtBeforeSwap = await usdtContract.balanceOf(signer.address);
  console.log(
    `before: DAI=${ethers.formatEther(balanceOfDaiBeforeSwap)} USDT=${ethers.formatUnits(balanceOfUsdtBeforeSwap, 6)}`
  );

  const amounts = await routerContract.getAmountsIn(amountOut, [
    usdtAddress,
    daiAddress,
  ]);
  const usdtNeeded = amounts[0];
  const maxUsdtToSpend = (usdtNeeded * 120n) / 100n;
  console.log(
    `need USDT=${ethers.formatUnits(usdtNeeded, 6)} max=${ethers.formatUnits(maxUsdtToSpend, 6)}`
  );

  await (await usdtContract.approve(routerAddress, maxUsdtToSpend)).wait();

  await routerContract.swapTokensForExactTokens(
    amountOut,
    maxUsdtToSpend,
    [usdtAddress, daiAddress],
    signer.address,
    Math.ceil(Date.now() / 1000) + 300
  );

  const balanceOfDaiAfterSwap = await daiContract.balanceOf(signer.address);
  const balanceOfUsdtAfterSwap = await usdtContract.balanceOf(signer.address);
  console.log(
    `after: DAI=${ethers.formatEther(balanceOfDaiAfterSwap)} USDT=${ethers.formatUnits(balanceOfUsdtAfterSwap, 6)}`
  );
  console.log(
    `diff: DAI=+${ethers.formatEther(
      balanceOfDaiAfterSwap - balanceOfDaiBeforeSwap
    )} USDT=-${ethers.formatUnits(
      balanceOfUsdtBeforeSwap - balanceOfUsdtAfterSwap,
      6
    )}`
  );
}

swapTokensForExactTokens(ethers.parseEther("1000")).catch((err) => {
  console.error(err);
  process.exitCode = 1;
});