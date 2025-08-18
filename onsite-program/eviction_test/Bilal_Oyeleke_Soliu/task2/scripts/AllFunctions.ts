import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const IMPERSONATED_ADDRESS = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";
const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const USDC_DAI_POOL_ADDRESS = "0xAE461cA67B15dc8dc81CE7615e0320dA1A9aB8D5";
const FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

async function setup() {
  await helpers.impersonateAccount(IMPERSONATED_ADDRESS);
  await helpers.setBalance(IMPERSONATED_ADDRESS, ethers.parseEther("100"));
  
  const provider = ethers.provider;
  const signer = await provider.getSigner(IMPERSONATED_ADDRESS);

  const usdcContract = await ethers.getContractAt("IERC20", USDC_ADDRESS);
  const daiContract = await ethers.getContractAt("IERC20", DAI_ADDRESS);
  const wethContract = await ethers.getContractAt("IERC20", WETH_ADDRESS);
  const routerContract = await ethers.getContractAt("IUniswapV2Router01", ROUTER_ADDRESS);
  const factoryContract = await ethers.getContractAt("IUniswapV2Factory", FACTORY_ADDRESS);
  const usdcDaiPoolContract = await ethers.getContractAt("IUniswapV2Pair", USDC_DAI_POOL_ADDRESS);

  return { 
    signer, 
    provider,
    usdcContract: usdcContract.connect(signer),
    daiContract: daiContract.connect(signer),
    wethContract: wethContract.connect(signer),
    routerContract: routerContract.connect(signer),
    factoryContract: factoryContract.connect(signer),
    usdcDaiPoolContract: usdcDaiPoolContract.connect(signer)
  };
}

async function printBalances(
  usdcContract: any,
  daiContract: any,
  poolContract: any,
  address: string,
  prefix: string = ""
) {
  const usdcBalance = await usdcContract?.balanceOf(address);
  const daiBalance = daiContract ? await daiContract.balanceOf(address) : 0;
  const poolBalance = poolContract ? await poolContract.balanceOf(address) : 0;

  if (usdcContract) {
    console.log(`${prefix}USDC Balance:`, ethers.formatUnits(usdcBalance, 6));
  }
  if (daiContract) {
    console.log(`${prefix}DAI Balance:`, ethers.formatUnits(daiBalance, 18));
  }
  if (poolContract) {
    console.log(`${prefix}Pool Balance:`, ethers.formatUnits(poolBalance, 18));
  }
}

async function testAddLiquidity() {
  console.log("\n=== Testing addLiquidity ===");
  const { signer, usdcContract, daiContract, routerContract, usdcDaiPoolContract } = await setup();

  const usdcDesired = ethers.parseUnits("1000", 6);
  const daiDesired = ethers.parseUnits("1000", 18);
  const usdcMin = ethers.parseUnits("900", 6);
  const daiMin = ethers.parseUnits("900", 18);
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

  await printBalances(usdcContract, daiContract, usdcDaiPoolContract, signer.address, "Before ");

  await (await usdcContract.approve(ROUTER_ADDRESS, usdcDesired)).wait();
  await (await daiContract.approve(ROUTER_ADDRESS, daiDesired)).wait();

  await routerContract.addLiquidity(
    USDC_ADDRESS,
    DAI_ADDRESS,
    usdcDesired,
    daiDesired,
    usdcMin,
    daiMin,
    signer.address,
    deadline
  );

  await printBalances(usdcContract, daiContract, usdcDaiPoolContract, signer.address, "After ");
}

async function testRemoveLiquidity() {
  console.log("\n=== Testing removeLiquidity ===");
  const { signer, usdcContract, daiContract, routerContract, usdcDaiPoolContract } = await setup();

  const usdcMin = ethers.parseUnits("900", 6);
  const daiMin = ethers.parseUnits("900", 18);
  const deadline = await helpers.time.latest() + 300;

  await printBalances(usdcContract, daiContract, usdcDaiPoolContract, signer.address, "Before ");

  const liquidity = await usdcDaiPoolContract.balanceOf(signer.address);
  await (await usdcDaiPoolContract.approve(ROUTER_ADDRESS, liquidity)).wait();

  await routerContract.removeLiquidity(
    USDC_ADDRESS,
    DAI_ADDRESS,
    liquidity,
    usdcMin,
    daiMin,
    signer.address,
    deadline
  );

  await printBalances(usdcContract, daiContract, usdcDaiPoolContract, signer.address, "After ");
}

async function testAddLiquidityETH() {
  console.log("\n=== Testing addLiquidityETH ===");
  const { signer } = await setup();

  const routerContract = await ethers.getContractAt("IUniswapV2Router01", ROUTER_ADDRESS);
  const factoryContract = await ethers.getContractAt("IUniswapV2Factory", FACTORY_ADDRESS);
  const usdcContract = await ethers.getContractAt("IERC20", USDC_ADDRESS);

  const connectedRouter = routerContract.connect(signer);
  const connectedFactory = factoryContract.connect(signer);
  const connectedUSDC = usdcContract.connect(signer);

  const wethAddress = await connectedRouter.WETH();
  const poolAddress = await connectedFactory.getPair(USDC_ADDRESS, wethAddress);
  const poolContract = await ethers.getContractAt("IUniswapV2Pair", poolAddress).then(c => c.connect(signer));

  const [reserveUSDC, reserveWETH] = await poolContract.getReserves();
  console.log(`USDC reserve: ${ethers.formatUnits(reserveUSDC, 6)}, WETH reserve: ${ethers.formatEther(reserveWETH)}`);

  const ethDesired = ethers.parseEther("1");
  const usdcDesired = ethDesired * reserveUSDC / reserveWETH;
  const usdcMin = ethers.parseUnits("1", 6);
  const ethMin = ethers.parseEther("0.9");
  const deadline = await helpers.time.latest() + 300;

  await printBalances(connectedUSDC, null, poolContract, signer.address, "Before ");

  await (await connectedUSDC.approve(ROUTER_ADDRESS, usdcDesired)).wait();

  const tx = await connectedRouter.addLiquidityETH(
    USDC_ADDRESS,
    usdcDesired,
    usdcMin,
    ethMin,
    signer.address,
    deadline,
    { value: ethDesired }
  );
  await tx.wait();

  await printBalances(connectedUSDC, null, poolContract, signer.address, "After ");
}

async function testRemoveLiquidityETH() {
  console.log("\n=== Testing removeLiquidityETH ===");
  const { signer, routerContract, factoryContract, usdcContract } = await setup();

  const wethAddress = await routerContract.WETH();
  const poolAddress = await factoryContract.getPair(USDC_ADDRESS, wethAddress);
  const poolContract = await ethers.getContractAt("IUniswapV2Pair", poolAddress).then(c => c.connect(signer));

  const [reserveUSDC, reserveWETH] = await poolContract.getReserves();
  console.log(`USDC reserve: ${ethers.formatUnits(reserveUSDC, 6)}, WETH reserve: ${ethers.formatEther(reserveWETH)}`);

  const usdcMin = ethers.parseUnits("1", 6);
  const ethMin = ethers.parseEther("0.9");
  const deadline = await helpers.time.latest() + 300;

  await printBalances(usdcContract, null, poolContract, signer.address, "Before ");

  const liquidity = await poolContract.balanceOf(signer.address);
  await (await poolContract.approve(ROUTER_ADDRESS, liquidity)).wait();

  await routerContract.removeLiquidityETH(
    USDC_ADDRESS,
    liquidity,
    usdcMin,
    ethMin,
    signer.address,
    deadline
  );

  await printBalances(usdcContract, null, poolContract, signer.address, "After ");
}

async function testSwapExactTokensForTokens() {
  console.log("\n=== Testing swapExactTokensForTokens ===");
  const { signer, usdcContract, daiContract, routerContract } = await setup();

  const amountIn = ethers.parseUnits("1000", 6);
  const amountOutMin = ethers.parseUnits("900", 18);
  const path = [USDC_ADDRESS, DAI_ADDRESS];
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  await printBalances(usdcContract, daiContract, null, signer.address, "Before ");

  await (await usdcContract.approve(ROUTER_ADDRESS, amountIn)).wait();

  const tx = await routerContract.swapExactTokensForTokens(
    amountIn,
    amountOutMin,
    path,
    signer.address,
    deadline
  );
  await tx.wait();

  await printBalances(usdcContract, daiContract, null, signer.address, "After ");
}

async function testSwapTokensForExactTokens() {
  console.log("\n=== Testing swapTokensForExactTokens ===");
  const { signer, usdcContract, daiContract, routerContract } = await setup();

  const amountOut = ethers.parseUnits("1000", 18);
  const amountInMax = ethers.parseUnits("1100", 6);
  const path = [USDC_ADDRESS, DAI_ADDRESS];
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  await printBalances(usdcContract, daiContract, null, signer.address, "Before ");

  await (await usdcContract.approve(ROUTER_ADDRESS, amountInMax)).wait();

  const tx = await routerContract.swapTokensForExactTokens(
    amountOut,
    amountInMax,
    path,
    signer.address,
    deadline
  );
  await tx.wait();

  await printBalances(usdcContract, daiContract, null, signer.address, "After ");
}

async function testSwapExactETHForTokens() {
  console.log("\n=== Testing swapExactETHForTokens ===");
  const { signer, daiContract, routerContract } = await setup();

  const amountOutMin = ethers.parseUnits("3000", 18);
  const path = [WETH_ADDRESS, DAI_ADDRESS];
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
  const ethAmount = ethers.parseEther("1");

  await printBalances(null, daiContract, null, signer.address, "Before ");

  const tx = await routerContract.swapExactETHForTokens(
    amountOutMin,
    path,
    signer.address,
    deadline,
    { value: ethAmount }
  );
  await tx.wait();

  await printBalances(null, daiContract, null, signer.address, "After ");
}

async function testSwapTokensForExactETH() {
  console.log("\n=== Testing swapTokensForExactETH ===");
  const { signer, usdcContract, routerContract } = await setup();

  const amountOut = ethers.parseEther("1");
  const amountInMax = ethers.parseUnits("3000", 6);
  const path = [USDC_ADDRESS, WETH_ADDRESS];
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  await printBalances(usdcContract, null, null, signer.address, "Before ");

  await (await usdcContract.approve(ROUTER_ADDRESS, amountInMax)).wait();

  const tx = await routerContract.swapTokensForExactETH(
    amountOut,
    amountInMax,
    path,
    signer.address,
    deadline
  );
  await tx.wait();

  await printBalances(usdcContract, null, null, signer.address, "After ");
}

async function testSwapExactTokensForETH() {
  console.log("\n=== Testing swapExactTokensForETH ===");
  const { signer, usdcContract, routerContract } = await setup();

  const amountIn = ethers.parseUnits("3000", 6);
  const amountOutMin = ethers.parseEther("0.9");
  const path = [USDC_ADDRESS, WETH_ADDRESS];
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  await printBalances(usdcContract, null, null, signer.address, "Before ");

  await (await usdcContract.approve(ROUTER_ADDRESS, amountIn)).wait();

  const tx = await routerContract.swapExactTokensForETH(
    amountIn,
    amountOutMin,
    path,
    signer.address,
    deadline
  );
  await tx.wait();

  await printBalances(usdcContract, null, null, signer.address, "After ");
}

async function testSwapETHForExactTokens() {
  console.log("\n=== Testing swapETHForExactTokens ===");
  const { signer, daiContract, routerContract } = await setup();

  const amountOut = ethers.parseUnits("3000", 18);
  const path = [WETH_ADDRESS, DAI_ADDRESS];
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
  const ethAmount = ethers.parseEther("1");

  await printBalances(null, daiContract, null, signer.address, "Before ");

  const tx = await routerContract.swapETHForExactTokens(
    amountOut,
    path,
    signer.address,
    deadline,
    { value: ethAmount }
  );
  await tx.wait();

  await printBalances(null, daiContract, null, signer.address, "After ");
}

async function testRemoveLiquidityWithPermit() {
  console.log("\n=== Testing removeLiquidityWithPermit ===");
  const { signer, usdcContract, daiContract, routerContract, usdcDaiPoolContract } = await setup();

  const usdcMin = ethers.parseUnits("900", 6);
  const daiMin = ethers.parseUnits("900", 18);
  const deadline = await helpers.time.latest() + 300;
  const liquidity = await usdcDaiPoolContract.balanceOf(signer.address);

  await printBalances(usdcContract, daiContract, usdcDaiPoolContract, signer.address, "Before ");

  const nonce = await usdcDaiPoolContract.nonces(signer.address);
  const domain = {
    name: await usdcDaiPoolContract.name(),
    version: "1",
    chainId: 1,
    verifyingContract: USDC_DAI_POOL_ADDRESS
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
  const value = {
    owner: signer.address,
    spender: ROUTER_ADDRESS,
    value: liquidity,
    nonce: nonce,
    deadline: deadline
  };

  const signature = await signer.signTypedData(domain, types, value);
  const { v, r, s } = ethers.Signature.from(signature);

  await routerContract.removeLiquidityWithPermit(
    USDC_ADDRESS,
    DAI_ADDRESS,
    liquidity,
    usdcMin,
    daiMin,
    signer.address,
    deadline,
    true,
    v,
    r,
    s
  );

  await printBalances(usdcContract, daiContract, usdcDaiPoolContract, signer.address, "After ");
}

async function testRemoveLiquidityETHWithPermit() {
  console.log("\n=== Testing removeLiquidityETHWithPermit ===");
  const { signer, routerContract, factoryContract, usdcContract } = await setup();

  const wethAddress = await routerContract.WETH();
  const poolAddress = await factoryContract.getPair(USDC_ADDRESS, wethAddress);
  const poolContract = await ethers.getContractAt("IUniswapV2Pair", poolAddress).then(c => c.connect(signer));

  const usdcMin = ethers.parseUnits("1", 6);
  const ethMin = ethers.parseEther("0.9");
  const deadline = await helpers.time.latest() + 300;
  const liquidity = await poolContract.balanceOf(signer.address);

  await printBalances(usdcContract, null, poolContract, signer.address, "Before ");

  const nonce = await poolContract.nonces(signer.address);
  const domain = {
    name: await poolContract.name(),
    version: "1",
    chainId: 1,
    verifyingContract: poolAddress
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
  const value = {
    owner: signer.address,
    spender: ROUTER_ADDRESS,
    value: liquidity,
    nonce: nonce,
    deadline: deadline
  };

  const signature = await signer.signTypedData(domain, types, value);
  const { v, r, s } = ethers.Signature.from(signature);

  await routerContract.removeLiquidityETHWithPermit(
    USDC_ADDRESS,
    liquidity,
    usdcMin,
    ethMin,
    signer.address,
    deadline,
    true,
    v,
    r,
    s
  );

  await printBalances(usdcContract, null, poolContract, signer.address, "After ");
}

async function testQuote() {
  console.log("\n=== Testing quote ===");
  const { routerContract } = await setup();

  const amountA = ethers.parseUnits("100", 18);
  const reserveA = ethers.parseUnits("1000", 18);
  const reserveB = ethers.parseUnits("2000", 18);

  const quotedAmount = await routerContract.quote(amountA, reserveA, reserveB);
  console.log(`Quoted amount: ${ethers.formatUnits(quotedAmount, 18)}`);
}

async function testGetAmountOut() {
  console.log("\n=== Testing getAmountOut ===");
  const { routerContract } = await setup();

  const amountIn = ethers.parseUnits("100", 18);
  const reserveIn = ethers.parseUnits("1000", 18);
  const reserveOut = ethers.parseUnits("2000", 18);

  const amountOut = await routerContract.getAmountOut(amountIn, reserveIn, reserveOut);
  console.log(`Amount out: ${ethers.formatUnits(amountOut, 18)}`);
}

async function testGetAmountIn() {
  console.log("\n=== Testing getAmountIn ===");
  const { routerContract } = await setup();

  const amountOut = ethers.parseUnits("100", 18);
  const reserveIn = ethers.parseUnits("1000", 18);
  const reserveOut = ethers.parseUnits("2000", 18);

  const amountIn = await routerContract.getAmountIn(amountOut, reserveIn, reserveOut);
  console.log(`Amount in: ${ethers.formatUnits(amountIn, 18)}`);
}

async function testGetAmountsOut() {
  console.log("\n=== Testing getAmountsOut ===");
  const { routerContract } = await setup();

  const amountIn = ethers.parseUnits("100", 18);
  const path = [DAI_ADDRESS, WETH_ADDRESS];

  const amountsOut = await routerContract.getAmountsOut(amountIn, path);
  console.log(`Amounts out: ${amountsOut.map(a => ethers.formatUnits(a, 18))}`);
}

async function testGetAmountsIn() {
  console.log("\n=== Testing getAmountsIn ===");
  const { routerContract } = await setup();

  const amountOut = ethers.parseUnits("1", 18);
  const path = [DAI_ADDRESS, WETH_ADDRESS];

  const amountsIn = await routerContract.getAmountsIn(amountOut, path);
  console.log(`Amounts in: ${amountsIn.map(a => ethers.formatUnits(a, 18))}`);
}

async function main() {
  try {
    await testAddLiquidity();
    await testRemoveLiquidity();
    await testAddLiquidityETH();
    await testRemoveLiquidityETH();
    await testSwapExactTokensForTokens();
    await testSwapTokensForExactTokens();
    await testSwapExactETHForTokens();
    await testSwapExactTokensForETH();
    await testSwapETHForExactTokens();
    await testRemoveLiquidityWithPermit();
    await testRemoveLiquidityETHWithPermit();
    await testQuote();
    await testGetAmountOut();
    await testGetAmountIn();
    await testGetAmountsOut();
    await testGetAmountsIn();
  } catch (error) {
    console.error("Error in main execution:", error);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});