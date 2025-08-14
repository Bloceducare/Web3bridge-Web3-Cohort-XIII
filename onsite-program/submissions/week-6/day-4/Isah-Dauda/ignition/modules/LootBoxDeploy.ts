import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LootboxModule = buildModule("LootboxModule", (m) => {
  
  const coordinator = m.getParameter(
    "coordinator",
    "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625" //For Sepolia not Mainnet o
  );
  const keyHash = m.getParameter(
    "keyHash",
    "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c" 
  );
  const subId = m.getParameter("subId", 1n); 
  const callbackGasLimit = m.getParameter("callbackGasLimit", 250000);
  const initialFee = m.getParameter("initialFee", 10000000000000000n);

  const lootbox = m.contract("LootBox", [
    coordinator,
    keyHash,
    subId,
    callbackGasLimit,
    initialFee,
  ]);

  return { lootbox };
});

export default LootboxModule;
