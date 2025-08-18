import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "hardhat";

const ENTRY_FEE = ethers.parseEther("0.01"); 

const LotteryModule = buildModule("LotteryModule", (m) => {

  const lottery = m.contract("Lottery", []);

 
  const accounts = m.getParameter("players", []) as unknown as any[];

  
  for (let i = 0; i < 10; i++) {
    const player = accounts[i];
    if (player) {
      m.transaction(lottery, "enter", [], { from: player, value: ENTRY_FEE });
    }
  }

  // 4️⃣ Return the deployed contract
  return { lottery };
});

export default LotteryModule;
