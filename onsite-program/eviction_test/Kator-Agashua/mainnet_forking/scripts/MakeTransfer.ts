import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

async function main() {
  const assetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621"; // Asset holder address
  const recipient = "0x948bEaCb6CE48E3B5655FF477f14A943d84E0c76"; // Recipient address

  // Impersonate the asset holder account
  await helpers.impersonateAccount(assetHolder);
  const assetHolderSigner = await ethers.getSigner(assetHolder);

  // USDT contract address (mainnet)
  const USDTAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
  const USDT = await ethers.getContractAt("IERC20", USDTAddress);

  // Connect USDT contract to assetHolderSigner
  const USDTWithSigner = USDT.connect(assetHolderSigner);

  // Check asset holder's USDT balance
  const assetHolderUSDTBalance = await USDTWithSigner.balanceOf(assetHolder);
  console.log(`USDT Balance of Asset Holder: ${assetHolderUSDTBalance}`);

  // Amount to send (e.g., 1000000 USDT, USDT has 6 decimals)
  const amount = ethers.parseUnits("1000000", 6);

  // Transfer USDT from assetHolder to recipient
  const tx = await USDTWithSigner.transfer(recipient, amount);
  await tx.wait();
  console.log(`Transferred 1000000 USDT from assetHolder to recipient.`);

  // Check recipient's USDT balance
  const recipientUSDTBalance = await USDTWithSigner.balanceOf(recipient);
  console.log(`USDT Balance of Recipient: ${recipientUSDTBalance}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
