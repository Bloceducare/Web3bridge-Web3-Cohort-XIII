import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LotteryModule = buildModule("LotteryModule", (m) => {
  const vrfCoordinator = m.getParameter("vrfCoordinator", "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625"); // Sepolia VRF
  const subscriptionId = m.getParameter("subscriptionId", 0); // Replace with your sub ID
  const keyHash = m.getParameter("keyHash", "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c"); // Sepolia key hash
  const entryFee = m.getParameter("entryFee", BigInt(10000000000000000)); // 0.01 ETH

  const lottery = m.contract("Lottery", [vrfCoordinator, subscriptionId, keyHash, entryFee]);

  return { lottery };
});

export default LotteryModule;