import { ethers } from "hardhat";

// Mainnet addresses
const UNISWAP_V2_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Router02
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

// Minimal ABIs
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
] as const;

const UNISWAP_V2_ROUTER_ABI = [
  "function WETH() view returns (address)",
  "function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
] as const;

const subBps = (x: bigint, bps: bigint) => (x * (10_000n - bps)) / 10_000n;

async function ensureCodeAt(address: string) {
  const code = await ethers.provider.getCode(address);
  if (code === "0x") {
    throw new Error(
      `No contract code at ${address}. This script expects a mainnet fork. Run with:\n  npx hardhat run scripts/swapExactETHForTokens.ts --network hardhat`
    );
  }
}

async function main() {
  await Promise.all([ensureCodeAt(UNISWAP_V2_ROUTER), ensureCodeAt(DAI)]);

  const [signer] = await ethers.getSigners();
  const me = await signer.getAddress();

  const router = new ethers.Contract(
    UNISWAP_V2_ROUTER,
    UNISWAP_V2_ROUTER_ABI,
    signer
  );

  const dai = new ethers.Contract(DAI, ERC20_ABI, signer);
  const [daiSym, daiDecs] = await Promise.all([dai.symbol(), dai.decimals()]);

  const weth: string = await router.WETH();
  const path = [weth, DAI];

  const ethIn = ethers.parseEther("0.1");
  const amountsOut: bigint[] = await router.getAmountsOut(ethIn, path);
  const outMin = subBps(amountsOut[1], 100n); // 1% slippage

  const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10); // 10 minutes

  const balBefore = await dai.balanceOf(me);
  console.log("Signer:", me);
  console.log("Spending ETH:", ethers.formatEther(ethIn));
  console.log("Expect at least:", ethers.formatUnits(outMin, daiDecs), daiSym);

  const tx = await router.swapExactETHForTokens(outMin, path, me, deadline, {
    value: ethIn,
  });
  const rcpt = await tx.wait();
  console.log("Tx hash:", rcpt?.hash ?? tx.hash);

  const balAfter = await dai.balanceOf(me);
  const received = balAfter - balBefore;
  console.log(
    `Received: ${ethers.formatUnits(received, daiDecs)} ${daiSym}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
