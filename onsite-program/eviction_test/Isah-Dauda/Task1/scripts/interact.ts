import { ethers } from "hardhat";

async function main() {
  const [owner, ...players] = await ethers.getSigners();

  const lotteryAddr = "0x6dD0110C934C265f5268Dcf6E868486Be6698835";
  const Lottery = await ethers.getContractFactory("Lottery");

  const lottery = Lottery.attach(lotteryAddr).connect(owner);

  console.log("Joining players together...");

  for (let i = 0; i < 10; i++) {
    await lottery.connect(players[i]).enter({ value: ethers.parseEther("0.01") });
  }

  const winnerEvent = await lottery.queryFilter("WinnerChosen", -1);
  const winner = (winnerEvent[0].args as any).winner;
  console.log("Winner of round 0:", winner);

  // RE_RUNNING ROUND ONE AGAIN for HONESTY CHECKS
  for (let i = 0; i < 10; i++) {
    await lottery.connect(players[i]).enter({ value: ethers.parseEther("0.01") });
  }

  const winnerEvent2 = await lottery.queryFilter("WinnerChosen", -1);
  const winner2 = (winnerEvent2[0].args as any).winner;
  console.log("Winner of round 1:", winner2);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


// THE INTERACTION DIDNT WORK WITH AN ERROR THAT 

// Joining players together...
// Error: contract runner does not support sending transactions (operation="sendTransaction", code=UNSUPPORTED_OPERATION, version=6.15.0)
//     at makeError (C:\PreachX\3briDge\Developments\EVICTION-TEST\TASK\node_modules\ethers\src.ts\utils\errors.ts:698:21)
//     at assert (C:\PreachX\3briDge\Developments\EVICTION-TEST\TASK\node_modules\ethers\src.ts\utils\errors.ts:719:25)
//     at send (C:\PreachX\3briDge\Developments\EVICTION-TEST\TASK\node_modules\ethers\src.ts\contract\contract.ts:310:15)
//     at Proxy.enter (C:\PreachX\3briDge\Developments\EVICTION-TEST\TASK\node_modules\ethers\src.ts\contract\contract.ts:352:22)
//     at main (C:\PreachX\3briDge\Developments\EVICTION-TEST\TASK\scripts\interact.ts:14:39) {
//   code: 'UNSUPPORTED_OPERATION',
//   operation: 'sendTransaction',
//   shortMessage: 'contract runner does not support sending transactions'