import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ClockNFT = buildModule("ClockNFT", (m) => {
  // Deploy the contract
  const clockNFT = m.contract("ClockNFT");

  // Your specific address as the deployer (this will be msg.sender)
  const numberOfTokensToMint = 5;

  // Mint tokens - the mint() function automatically mints to msg.sender
  for (let i = 0; i < numberOfTokensToMint; i++) {
    m.call(clockNFT, "mint", [], {
      id: `mint_token_${i + 1}`,
    });
  }

  return { clockNFT };
});

export default ClockNFT;
