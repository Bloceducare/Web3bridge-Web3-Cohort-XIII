import { ethers } from "hardhat";

const whale = "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503";
const routerAddress = "0xf164fC0Ec4E93095b804a4795bBe1e041497b92a";
const factoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const chainlinkAddress = "0x514910771AF9Ca656af840dff83E8264EcF986CA";
const shibaInuAddress = "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE";
let pairAddress;

const createAndFundPair = async () => {
  const signer = await ethers.getImpersonatedSigner(whale);

  const [deployer] = await ethers.getSigners();
  const gasPrice = ethers.parseUnits("200", "gwei");
  await deployer.sendTransaction({
    to: signer.address,
    value: ethers.parseEther("5"),
    gasPrice,
  });

  const factoryContract = await ethers.getContractAt(
    "IUniswapV2Factory",
    factoryAddress,
    signer
  );

  const routerContract = await ethers.getContractAt(
    "IUniswapV2Router01",
    routerAddress,
    signer
  );

  const shibaInuContract = await ethers.getContractAt(
    "IERC20",
    shibaInuAddress,
    signer
  );
  const chainlinkContract = await ethers.getContractAt(
    "IERC20",
    chainlinkAddress,
    signer
  );

  let pairContract;

  pairAddress = await factoryContract.getPair(
    shibaInuAddress,
    chainlinkAddress
  );

  const whaleShibaInuBalanceBeforeAdding = await shibaInuContract.balanceOf(
    signer.address
  );
  const whaleChainlinkBalanceBeforeAdding = await chainlinkContract.balanceOf(
    signer.address
  );

  console.log(
    `before: LINK=${ethers.formatEther(whaleChainlinkBalanceBeforeAdding)} SHIB=${ethers.formatEther(
      whaleShibaInuBalanceBeforeAdding
    )}`
  );

  if (ethers.ZeroAddress == pairAddress) {
    await (
      await factoryContract.createPair(shibaInuAddress, chainlinkAddress)
    ).wait();
    pairAddress = await factoryContract.getPair(
      shibaInuAddress,
      chainlinkAddress
    );
    console.log(`pair created: ${pairAddress}`);
  }

  pairContract = await ethers.getContractAt("IERC20", pairAddress, signer);

  const pairShibaBalanceBeforeAddition = await shibaInuContract.balanceOf(
    pairAddress
  );
  const pairChainlinkBalanceBeforeAddition = await chainlinkContract.balanceOf(
    pairAddress
  );

  console.log(
    `pool before: SHIB=${ethers.formatEther(
      pairShibaBalanceBeforeAddition
    )} LINK=${ethers.formatEther(pairChainlinkBalanceBeforeAddition)}`
  );

  const amountOfShibaToBeAdded = ethers.parseEther("1");
  const amountOfLinkToBeAdded = ethers.parseEther("5800000");

  await (
    await shibaInuContract.approve(routerAddress, amountOfShibaToBeAdded)
  ).wait();
  await (
    await chainlinkContract.approve(routerAddress, amountOfLinkToBeAdded)
  ).wait();

  await (
    await routerContract.addLiquidity(
      shibaInuAddress,
      chainlinkAddress,
      amountOfShibaToBeAdded,
      amountOfLinkToBeAdded,
      0,
      0,
      signer.address,
      Math.ceil(Date.now() / 1000) + 3600
    )
  ).wait();

  const pairShibaBalanceAfterAddition = await shibaInuContract.balanceOf(
    pairAddress
  );
  const pairChainlinkBalanceAfterAddition = await chainlinkContract.balanceOf(
    pairAddress
  );

  console.log(
    `pool after: SHIB=${ethers.formatEther(
      pairShibaBalanceAfterAddition
    )} LINK=${ethers.formatEther(pairChainlinkBalanceAfterAddition)}`
  );

  const whaleShibaInuBalanceAfterAdding = await shibaInuContract.balanceOf(
    signer.address
  );
  const whaleChainlinkBalanceAfterAdding = await chainlinkContract.balanceOf(
    signer.address
  );

  console.log(
    `after: LINK=${ethers.formatEther(whaleChainlinkBalanceAfterAdding)} SHIB=${ethers.formatEther(
      whaleShibaInuBalanceAfterAdding
    )}`
  );

  console.log(
    `diff: SHIB=-${ethers.formatEther(
      whaleShibaInuBalanceBeforeAdding - whaleShibaInuBalanceAfterAdding
    )} LINK=-${ethers.formatEther(
      whaleChainlinkBalanceBeforeAdding - whaleChainlinkBalanceAfterAdding
    )}`
  );
};

createAndFundPair().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});