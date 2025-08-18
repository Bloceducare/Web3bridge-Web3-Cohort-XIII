import { ethers } from "hardhat";

// Mainnet addresses
const UNISWAP_V2_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Router02
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // 6 decimals

// Minimal ABIs
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
] as const;

const UNISWAP_V2_ROUTER_ABI = [
  "function WETH() view returns (address)",
  "function getAmountsIn(uint256 amountOut, address[] calldata path) external view returns (uint256[] memory amounts)",
  "function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
] as const;

const addBps = (x: bigint, bps: bigint) => (x * (10_000n + bps)) / 10_000n;

async function ensureCodeAt(address: string) {
  const code = await ethers.provider.getCode(address);
  if (code === "0x") {
    throw new Error(
      `No contract code at ${address}. This script expects a mainnet fork. Run with:\n  npx hardhat run scripts/swapETHForExactTokens.ts --network hardhat`
    );
  }
}

async function main() {
  await Promise.all([ensureCodeAt(UNISWAP_V2_ROUTER), ensureCodeAt(USDC)]);

  const [signer] = await ethers.getSigners();
  const me = await signer.getAddress();

  const router = new ethers.Contract(
    UNISWAP_V2_ROUTER,
    UNISWAP_V2_ROUTER_ABI,
    signer
  );

  const usdc = new ethers.Contract(USDC, ERC20_ABI, signer);
  const [usdcSym, usdcDecs] = await Promise.all([
    usdc.symbol(),
    usdc.decimals(),
  ]);

  const weth: string = await router.WETH();
  const path = [weth, USDC];

  const exactOut = ethers.parseUnits("50", usdcDecs); // 50 USDC
  const amountsIn: bigint[] = await router.getAmountsIn(exactOut, path);
  const maxEthIn = addBps(amountsIn[0], 100n); // +1%

  const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10); // 10 minutes

  const balBefore = await usdc.balanceOf(me);
  console.log("Signer:", me);
  console.log("Aiming for:", ethers.formatUnits(exactOut, usdcDecs), usdcSym);
  console.log("Max ETH:", ethers.formatEther(maxEthIn));

  const tx = await router.swapETHForExactTokens(exactOut, path, me, deadline, {
    value: maxEthIn,
  });
  const rcpt = await tx.wait();
  console.log("Tx hash:", rcpt?.hash ?? tx.hash);

  const balAfter = await usdc.balanceOf(me);
  const received = balAfter - balBefore;
  console.log(
    `Received: ${ethers.formatUnits(received, usdcDecs)} ${usdcSym}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
