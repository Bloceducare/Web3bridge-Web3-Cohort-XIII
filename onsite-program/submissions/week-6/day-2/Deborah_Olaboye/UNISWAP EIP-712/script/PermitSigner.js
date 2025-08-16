const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  const provider = new ethers.JsonRpcProvider("https://rpc.sepolia-api.lisk.com");
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("PRIVATE_KEY env var missing");

  const wallet = new ethers.Wallet(privateKey, provider);

  const wtkAddress = "0xd6e1afe5cA8D00A2EFC01B89997abE2De47fdfAf"; 
  const permitSwapAddress = "0xB0f05d25e41FbC2b52013099ED9616f1206Ae21B";

  const tokenABI = [
    "function name() view returns (string)",
    "function nonces(address) view returns (uint256)",
  ];

  const token = new ethers.Contract(wtkAddress, tokenABI, wallet);

  let name;
  try {
    name = await token.name();
    console.log("Token Name:", name);
  } catch (error) {
    console.error("Failed to fetch token name:", error);
    throw new Error("Invalid contract or name() function");
  }

  const nonce = await token.nonces(wallet.address);
  const chainId = (await provider.getNetwork()).chainId;

  const domain = {
    name,
    version: "1",
    chainId,
    verifyingContract: wtkAddress,
  };

  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };

  const amountIn = ethers.parseUnits("471000", 18); // Adjusted for 18 decimals
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  const message = {
    owner: wallet.address,
    spender: permitSwapAddress,
    value: amountIn,
    nonce: ethers.toNumber(nonce),
    deadline,
  };

  const signature = await wallet.signTypedData(domain, types, message);
  const sig = ethers.Signature.from(signature); // Use ethers.Signature.from instead of splitSignature

  console.log("PERMIT_V =", sig.v);
  console.log("PERMIT_R =", sig.r);
  console.log("PERMIT_S =", sig.s);
}

main().catch(console.error);