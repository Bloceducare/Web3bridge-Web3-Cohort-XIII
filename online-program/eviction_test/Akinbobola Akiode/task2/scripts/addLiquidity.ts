import { ethers } from "hardhat";

const whaleAddress = "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503";
const routerAddress = "0xf164fC0Ec4E93095b804a4795bBe1e041497b92a";
let pairAddress;
const usdtAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const daiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const factoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

async function addLiquidity() {
  try {
  const factoryContract = await ethers.getContractAt(
    "IUniswapV2Factory",
    factoryAddress
  );
  pairAddress = await factoryContract.getPair(usdtAddress, daiAddress);
    console.log(`pair: ${pairAddress}`);
    if (pairAddress === ethers.ZeroAddress) return console.log("no pair");

  const signer = await ethers.getImpersonatedSigner(whaleAddress);
  const [deployer] = await ethers.getSigners();

    const gasPrice = ethers.parseUnits("200", "gwei");
    await deployer.sendTransaction({ to: signer.address, value: ethers.parseEther("10"), gasPrice });

    const dai = await ethers.getContractAt("IERC20", daiAddress, signer);
    const usdt = await ethers.getContractAt("IERC20", usdtAddress, signer);
    const router = await ethers.getContractAt("IUniswapV2Router01", routerAddress, signer);

    const whaleUsdtBefore = await usdt.balanceOf(signer.address);
    const whaleDaiBefore = await dai.balanceOf(signer.address);
    const poolUsdtBefore = await usdt.balanceOf(pairAddress);
    const poolDaiBefore = await dai.balanceOf(pairAddress);
  console.log(
      `before: whale USDT=${ethers.formatUnits(whaleUsdtBefore, 6)} DAI=${ethers.formatEther(whaleDaiBefore)} | pool USDT=${ethers.formatUnits(
        poolUsdtBefore,
        6
      )} DAI=${ethers.formatEther(poolDaiBefore)}`
    );

    const addDai = ethers.parseEther("10");
    const addUsdt = ethers.parseUnits("10", 6);
    const minDai = (addDai * 95n) / 100n;
    const minUsdt = (addUsdt * 95n) / 100n;

    const usdtAllowance = await usdt.allowance(signer.address, routerAddress);
    if (usdtAllowance < addUsdt) await (await usdt.approve(routerAddress, addUsdt)).wait();
    const daiAllowance = await dai.allowance(signer.address, routerAddress);
    if (daiAllowance < addDai) await (await dai.approve(routerAddress, addDai)).wait();

    const tx = await router.addLiquidity(
      usdtAddress,
      daiAddress,
      addUsdt,
      addDai,
      minUsdt,
      minDai,
      signer.address,
      Math.ceil(Date.now() / 1000) + 300
    );
    const receipt = await tx.wait();
    console.log(`tx: ${tx.hash} gas=${receipt ? receipt.gasUsed.toString() : "-"}`);

    const whaleUsdtAfter = await usdt.balanceOf(signer.address);
    const whaleDaiAfter = await dai.balanceOf(signer.address);
    const poolUsdtAfter = await usdt.balanceOf(pairAddress);
    const poolDaiAfter = await dai.balanceOf(pairAddress);
  console.log(
      `after: whale USDT=${ethers.formatUnits(whaleUsdtAfter, 6)} DAI=${ethers.formatEther(whaleDaiAfter)} | pool USDT=${ethers.formatUnits(
        poolUsdtAfter,
        6
      )} DAI=${ethers.formatEther(poolDaiAfter)}`
    );
  } catch (error: any) {
    console.error("addLiquidity error:", error?.message || error);
  }
}

addLiquidity()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});