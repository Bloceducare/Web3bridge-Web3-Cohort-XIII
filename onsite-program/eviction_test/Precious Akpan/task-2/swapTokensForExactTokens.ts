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
  "function getAmountsIn(uint256 amountOut, address[] calldata path) external view returns (uint256[] memory amounts)",
  "function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
] as const;

const addBps = (x: bigint, bps: bigint) => (x * (10_000n + bps)) / 10_000n;

async function ensureCodeAt(address: string) {
  const code = await ethers.provider.getCode(address);
  if (code === "0x") {
    throw new Error(
      `No contract code at ${address}. This script expects a mainnet fork. Run with:\n  npx hardhat run scripts/swapTokensForExactTokens.ts --network hardhat`
    );
  }
}

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

async function main() {
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

  const path = [USDC, DAI];

  const exactDaiOut = ethers.parseUnits("10", daiDecs); // 10 DAI
  const amountsIn: bigint[] = await router.getAmountsIn(exactDaiOut, path);
  const maxUsdcIn = addBps(amountsIn[0], 100n); // +1%

  await approveIfNeeded(usdc, me, UNISWAP_V2_ROUTER, maxUsdcIn);

  const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10);

  const beforeIn = await usdc.balanceOf(me);
  const beforeOut = await dai.balanceOf(me);

  console.log("Signer:", me);
  console.log(
    `Getting ${ethers.formatUnits(exactDaiOut, daiDecs)} ${daiSym} paying up to ${ethers.formatUnits(maxUsdcIn, usdcDecs)} ${usdcSym}`
  );

  const tx = await router.swapTokensForExactTokens(
    exactDaiOut,
    maxUsdcIn,
    path,
    me,
    deadline
  );
  const rcpt = await tx.wait();
  console.log("Tx hash:", rcpt?.hash ?? tx.hash);

  const afterIn = await usdc.balanceOf(me);
  const afterOut = await dai.balanceOf(me);

  console.log(
    `Delta ${usdcSym}: -${ethers.formatUnits(beforeIn - afterIn, usdcDecs)}`
  );
  console.log(
    `Delta ${daiSym}: +${ethers.formatUnits(afterOut - beforeOut, daiDecs)}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
