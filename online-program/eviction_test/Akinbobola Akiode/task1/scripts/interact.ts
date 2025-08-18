import { ethers } from "hardhat";

async function main() {
  const entryFee = ethers.parseEther("0.01");
  const Lottery = await ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy(entryFee);
  await lottery.waitForDeployment();

  const accounts = await ethers.getSigners();
  const participants = accounts.slice(0, 10);

  const balancesBefore = await Promise.all(
    participants.map(async (s) => ({ addr: await s.getAddress(), bal: await ethers.provider.getBalance(await s.getAddress()) }))
  );

  for (let i = 0; i < 10; i++) {
    await lottery.connect(participants[i]).enterLottery({ value: entryFee });
  }

  const evts1 = await lottery.queryFilter(lottery.filters.WinnerSelected());
  const last1 = evts1[evts1.length - 1];
  console.log(`Winner (round ${await last1.args?.round}): ${await last1.args?.winner}`);
  console.log(`Round after run: ${await lottery.currentRound()}`);

  const balancesAfter = await Promise.all(
    participants.map(async (s) => ({ addr: await s.getAddress(), bal: await ethers.provider.getBalance(await s.getAddress()) }))
  );
  console.table({ before: balancesBefore, after: balancesAfter });

  for (let i = 0; i < 10; i++) {
    await lottery.connect(participants[i]).enterLottery({ value: entryFee });
  }
  const evts2 = await lottery.queryFilter(lottery.filters.WinnerSelected());
  const last2 = evts2[evts2.length - 1];
  console.log(`Winner (round ${await last2.args?.round}): ${await last2.args?.winner}`);
  console.log(`Round after second run: ${await lottery.currentRound()}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


