import { ethers } from "hardhat";

// Mainnet addresses
const UNISWAP_V2_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Router02
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

// Minimal ABIs
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
] as const;

const UNISWAP_V2_ROUTER_ABI = [
  "function WETH() view returns (address)",
  "function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory amounts)",
  "function getAmountsIn(uint256 amountOut, address[] calldata path) external view returns (uint256[] memory amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
] as const;

// Helpers
const addBps = (x: bigint, bps: bigint) => (x * (10_000n + bps)) / 10_000n;
const subBps = (x: bigint, bps: bigint) => (x * (10_000n - bps)) / 10_000n;

async function approveIfNeeded(
  token: any,
  owner: string,
  spender: string,
  required: bigint
) {
  const current: bigint = await token.allowance(owner, spender);
  if (current >= required) return;
  const tx = await token.approve(spender, required);
  await tx.wait();
}

async function ensureCodeAt(address: string) {
  const code = await ethers.provider.getCode(address);
  if (code === "0x") {
    throw new Error(
      `No contract code at ${address}. This script expects a mainnet fork. Run with:\n  npx hardhat run scripts/main.ts --network hardhat`
    );
  }
}

async function logTokenBalance(token: any, who: string) {
  const [sym, decs, bal] = await Promise.all([
    token.symbol(),
    token.decimals(),
    token.balanceOf(who),
  ]);
  console.log(`${who} -> ${sym}: ${ethers.formatUnits(bal, decs)}`);
}

async function main() {
  // Preflight: ensure mainnet fork (code present at router and tokens)
  await Promise.all([
    ensureCodeAt(UNISWAP_V2_ROUTER),
    ensureCodeAt(DAI),
    ensureCodeAt(USDC),
  ]);

  const [signer] = await ethers.getSigners();
  const me = await signer.getAddress();

  const router = new ethers.Contract(
    UNISWAP_V2_ROUTER,
    UNISWAP_V2_ROUTER_ABI,
    signer
  );

  const dai = new ethers.Contract(DAI, ERC20_ABI, signer);
  const usdc = new ethers.Contract(USDC, ERC20_ABI, signer);

  const [daiSym, daiDecs, usdcSym, usdcDecs] = await Promise.all([
    dai.symbol(),
    dai.decimals(),
    usdc.symbol(),
    usdc.decimals(),
  ]);

  const weth: string = await router.WETH();

  const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10); // 10 minutes
  const slippageBps = 100n; // 1%

  console.log("Signer:", me);
  console.log("Router:", UNISWAP_V2_ROUTER);
  console.log("WETH:", weth);
  console.log(`Tokens: ${daiSym}(${DAI}), ${usdcSym}(${USDC})`);

  console.log("\n=== Initial Balances ===");
  await logTokenBalance(dai, me);
  await logTokenBalance(usdc, me);
  const ethBal0 = await ethers.provider.getBalance(me);
  console.log(`${me} -> ETH: ${ethers.formatEther(ethBal0)}`);

  // 1) swapExactETHForTokens: Spend exact ETH to get at least min amount of DAI
  {
    const path = [weth, DAI];
    const ethIn = ethers.parseEther("0.1");
    const amountsOut: bigint[] = await router.getAmountsOut(ethIn, path);
    const outMin = subBps(amountsOut[1], slippageBps);
    console.log("\n[swapExactETHForTokens] spending ETH:", ethers.formatEther(ethIn), "for at least", ethers.formatUnits(outMin, daiDecs), daiSym);
    const tx = await router.swapExactETHForTokens(outMin, path, me, deadline, {
      value: ethIn,
    });
    await tx.wait();
  }

  // 2) swapETHForExactTokens: Get exact USDC, pay up to max ETH
  {
    const path = [weth, USDC];
    const exactOut = ethers.parseUnits("50", usdcDecs);
    const amountsIn: bigint[] = await router.getAmountsIn(exactOut, path);
    const maxEthIn = addBps(amountsIn[0], slippageBps);
    console.log("\n[swapETHForExactTokens] aiming for", ethers.formatUnits(exactOut, usdcDecs), usdcSym, "paying up to", ethers.formatEther(maxEthIn), "ETH");
    const tx = await router.swapETHForExactTokens(exactOut, path, me, deadline, {
      value: maxEthIn,
    });
    await tx.wait();
  }

  // 3) swapExactTokensForETH: Spend exact DAI to receive min ETH
  {
    const path = [DAI, weth];
    const amountIn = ethers.parseUnits("10", daiDecs);
    await approveIfNeeded(dai, me, UNISWAP_V2_ROUTER, amountIn);

    const amountsOut: bigint[] = await router.getAmountsOut(amountIn, path);
    const minEthOut = subBps(amountsOut[1], slippageBps);

    console.log("\n[swapExactTokensForETH] spending", ethers.formatUnits(amountIn, daiDecs), daiSym, "for at least", ethers.formatEther(minEthOut), "ETH");
    const tx = await router.swapExactTokensForETH(
      amountIn,
      minEthOut,
      path,
      me,
      deadline
    );
    await tx.wait();
  }

  // 4) swapTokensForExactETH: Get exact ETH by paying up to max USDC
  {
    const path = [USDC, weth];
    const exactEthOut = ethers.parseEther("0.01");
    const amountsIn: bigint[] = await router.getAmountsIn(exactEthOut, path);
    const maxUsdcIn = addBps(amountsIn[0], slippageBps);

    await approveIfNeeded(usdc, me, UNISWAP_V2_ROUTER, maxUsdcIn);

    console.log("\n[swapTokensForExactETH] aiming for", ethers.formatEther(exactEthOut), "ETH paying up to", ethers.formatUnits(maxUsdcIn, usdcDecs), usdcSym);
    const tx = await router.swapTokensForExactETH(
      exactEthOut,
      maxUsdcIn,
      path,
      me,
      deadline
    );
    await tx.wait();
  }

  // 5) swapExactTokensForTokens: Spend exact DAI for min USDC
  {
    const path = [DAI, USDC];
    const amountIn = ethers.parseUnits("5", daiDecs);
    await approveIfNeeded(dai, me, UNISWAP_V2_ROUTER, amountIn);

    const amountsOut: bigint[] = await router.getAmountsOut(amountIn, path);
    const minUsdcOut = subBps(amountsOut[1], slippageBps);

    console.log("\n[swapExactTokensForTokens] spending", ethers.formatUnits(amountIn, daiDecs), daiSym, "for at least", ethers.formatUnits(minUsdcOut, usdcDecs), usdcSym);
    const tx = await router.swapExactTokensForTokens(
      amountIn,
      minUsdcOut,
      path,
      me,
      deadline
    );
    await tx.wait();
  }

  // 6) swapTokensForExactTokens: Get exact DAI by paying up to max USDC
  {
    const path = [USDC, DAI];
    const exactDaiOut = ethers.parseUnits("10", daiDecs);
    const amountsIn: bigint[] = await router.getAmountsIn(exactDaiOut, path);
    const maxUsdcIn = addBps(amountsIn[0], slippageBps);

    await approveIfNeeded(usdc, me, UNISWAP_V2_ROUTER, maxUsdcIn);

    console.log("\n[swapTokensForExactTokens] aiming for", ethers.formatUnits(exactDaiOut, daiDecs), daiSym, "paying up to", ethers.formatUnits(maxUsdcIn, usdcDecs), usdcSym);
    const tx = await router.swapTokensForExactTokens(
      exactDaiOut,
      maxUsdcIn,
      path,
      me,
      deadline
    );
    await tx.wait();
  }

  console.log("\n=== Final Balances ===");
  await logTokenBalance(dai, me);
  await logTokenBalance(usdc, me);
  const ethBal = await ethers.provider.getBalance(me);
  console.log(`${me} -> ETH: ${ethers.formatEther(ethBal)}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
