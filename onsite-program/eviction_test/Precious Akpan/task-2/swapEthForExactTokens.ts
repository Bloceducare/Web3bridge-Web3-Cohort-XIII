import { ethers } from "hardhat";

// Minimal ABIs
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
] as const;

const UNISWAP_V2_ROUTER_ABI = [
  "function WETH() view returns (address)",
  "function getAmountsIn(uint256 amountOut, address[] calldata path) external view returns (uint256[] memory amounts)",
  "function swapETHForExactTokens(uint256 amountOut, address[] calldata path, address to, uint256 deadline) external payable returns (uint256[] memory amounts)",
] as const;

async function main() {
  // Uniswap V2 Router02 (Mainnet)
  const UNISWAP_V2_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  // Target token to receive (DAI Mainnet)
  const TOKEN_OUT = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; // DAI

  // Preflight checks: ensure running on a mainnet fork where these addresses have code
  const [codeRouter, codeToken] = await Promise.all([
    ethers.provider.getCode(UNISWAP_V2_ROUTER),
    ethers.provider.getCode(TOKEN_OUT),
  ]);

  if (codeRouter === "0x" || codeToken === "0x") {
    throw new Error(
      "This script expects a mainnet fork. Configure forking in hardhat.config.ts and run:\n" +
        "  npx hardhat run scripts/swapEthForExactTokens.ts --network hardhat"
    );
  }

  const [signer] = await ethers.getSigners();
  const signerAddr = await signer.getAddress();

  const router = new ethers.Contract(
    UNISWAP_V2_ROUTER,
    UNISWAP_V2_ROUTER_ABI,
    signer
  );

  const token = new ethers.Contract(TOKEN_OUT, ERC20_ABI, signer);
  const tokenSymbol: string = await token.symbol();
  const tokenDecimals: number = await token.decimals();

  const wethAddress: string = await router.WETH();
  const path = [wethAddress, TOKEN_OUT];

  // Desired output amount: e.g., 100 tokens (DAI)
  const desiredOutHuman = "100";
  const amountOut = ethers.parseUnits(desiredOutHuman, tokenDecimals);

  // Query required ETH input via getAmountsIn and add slippage buffer (e.g., 1%)
  const amountsIn: bigint[] = await router.getAmountsIn(amountOut, path);
  const requiredIn: bigint = amountsIn[0];

  const slippageBps = 100n; // 1%
  const BPS = 10_000n;
  const amountInMax = (requiredIn * (BPS + slippageBps)) / BPS;

  const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10); // 10 minutes

  const balanceBefore = await token.balanceOf(signerAddr);

  console.log("--- Swap Plan ---");
  console.log("Account:", signerAddr);
  console.log("Token Out:", tokenSymbol, TOKEN_OUT);
  console.log("Desired Out:", desiredOutHuman, tokenSymbol);
  console.log("Required ETH In:", ethers.formatEther(requiredIn));
  console.log(
    "Max ETH In (with 1% slippage buffer):",
    ethers.formatEther(amountInMax)
  );

  const tx = await router.swapETHForExactTokens(
    amountOut,
    path,
    signerAddr,
    deadline,
    { value: amountInMax }
  );
  const receipt = await tx.wait();

  console.log("Swap tx hash:", receipt?.hash ?? tx.hash);
  console.log("Gas used:", receipt?.gasUsed?.toString() ?? "n/a");

  const balanceAfter = await token.balanceOf(signerAddr);
  const received = balanceAfter - balanceBefore;

  console.log("--- Result ---");
  console.log(
    `Token balance change: +${ethers.formatUnits(received, tokenDecimals)} ${tokenSymbol}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
