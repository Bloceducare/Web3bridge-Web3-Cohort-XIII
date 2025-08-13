// import { vars } from "hardhat/config";
// import { ethers } from "ethers";
// import * as fs from "fs";

// async function main() {
//   // Load vars from Hardhat's secure store
//   const RPC =
//     (await vars.get("RELAYER_RPC")) ||
//     (await vars.get("FORKING_URL")) ||
//     "http://127.0.0.1:8545";

//   const provider = new ethers.JsonRpcProvider(RPC);

//   const relayerPk = await vars.get("RELAYER_PRIVATE_KEY");
//   if (!relayerPk) throw new Error("Set RELAYER_PRIVATE_KEY with `npx hardhat vars set RELAYER_PRIVATE_KEY <key>`");
//   const relayer = new ethers.Wallet(relayerPk, provider);

//   const SWAP_CONTRACT = await vars.get("SWAP_CONTRACT_ADDRESS");
//   if (!SWAP_CONTRACT) throw new Error("Set SWAP_CONTRACT_ADDRESS");

//   const payload = JSON.parse(fs.readFileSync("signed-permit.json", "utf8"));
//   const { permitSingle, signature, owner, amountIn } = payload;

//   const abi = [
//     "function executeSwapWithPermit2(((address,uint160,uint48,uint48),address,uint256) permitSingle, bytes signature, address owner, uint160 amountIn, uint amountOutMin, address[] path, uint swapDeadline) external"
//   ];

//   const contract = new ethers.Contract(SWAP_CONTRACT, abi, relayer);

//   // Configure swap params
//   const amountOutMin = BigInt((await vars.get("AMOUNT_OUT_MIN")) || "0");
//   const tokenIn = permitSingle.details.token;
//   const tokenOut = await vars.get("FORK_TOKEN_OUT");
//   if (!tokenOut) throw new Error("Set FORK_TOKEN_OUT");

//   const path = [tokenIn, tokenOut];
//   const swapDeadline = Math.floor(Date.now() / 1000) + 1800;

//   console.log("Submitting executeSwapWithPermit2...");

//   const tx = await contract.executeSwapWithPermit2(
//     permitSingle,
//     signature,
//     owner,
//     BigInt(amountIn),
//     amountOutMin,
//     path,
//     swapDeadline,
//     { gasLimit: 2_000_000 }
//   );

//   console.log("tx hash:", tx.hash);
//   const rc = await tx.wait();
//   console.log("tx confirmed:", rc.transactionHash);
// }

// main().catch((err) => {
//   console.error(err);
//   process.exitCode = 1;
// });
