import { vars } from "hardhat/config";
import { ethers } from "hardhat";
import { TypedDataDomain, TypedDataField } from "ethers";

async function main() {
  const MAINNET_RPC_URL = `https://eth-mainnet.g.alchemy.com/v2/${await vars.get("ALCHEMY_API_KEY")}`;
  const PRIVATE_KEY = await vars.get("PRIVATE_KEY");

  const provider = new ethers.JsonRpcProvider(MAINNET_RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log(`Using wallet: ${wallet.address}`);

  const permit2Address = "0x000000000022D473030F116dDEE9F6B43aC78BA3"; // Uniswap Permit2 mainnet
  const uniswapRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // UniswapV2 router

  const tokenIn = "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"; // USDC
  const tokenOut = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; // DAI

  const amountIn = ethers.parseUnits("10", 6); // 10 USDC
  const nonce = 0;
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  const domain: TypedDataDomain = {
    name: "Permit2",
    chainId: 1,
    verifyingContract: permit2Address,
  };

  const types: Record<string, TypedDataField[]> = {
    PermitTransferFrom: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };

  const values = {
    token: tokenIn,
    amount: amountIn,
    nonce,
    deadline,
  };

  const signature = await wallet.signTypedData(domain, types, values);

  console.log("Permit signature:", signature);

  // Deploy swap executor on fork
  const Executor = await ethers.getContractFactory("Permit2Swap");
  const executor = await Executor.deploy(permit2Address, uniswapRouter);
  await executor.waitForDeployment();

  console.log(`Executor deployed at: ${await executor.getAddress()}`);

  // Execute permit + swap
  const tx = await executor.permitAndSwap(
    values,
    { to: await wallet.getAddress(), requestedAmount: amountIn },
    await wallet.getAddress(),
    signature,
    [tokenIn, tokenOut],
    0, // accept any amount for demo
    deadline
  );

  const receipt = await tx.wait();
  console.log("Swap transaction mined:", receipt?.hash);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
