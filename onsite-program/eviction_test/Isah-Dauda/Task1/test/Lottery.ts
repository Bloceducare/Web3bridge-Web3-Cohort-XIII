import { expect } from "chai";
import { ethers } from "hardhat";

describe("Lottery Contract", function () {
  it("Should only allow entry with exact 0.01 ETH", async function () {
    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy();
    await lottery.waitForDeployment();

    const [player1] = await ethers.getSigners();

    await expect(
      lottery.connect(player1).enter({ value: ethers.parseEther("0.02") })
    ).to.be.revertedWith("Must send exactly 0.01 ETH");

    await lottery.connect(player1).enter({ value: ethers.parseEther("0.01") });
    const players = await lottery.getPlayers();
    expect(players.length).to.equal(1);
  });

  it("Should track exactly 10 players and then pick winner", async function () {
    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy();
    await lottery.waitForDeployment();

    const signers = await ethers.getSigners();

    for (let i = 0; i < 10; i++) {
      await lottery.connect(signers[i]).enter({ value: ethers.parseEther("0.01") });
    }

    const players = await lottery.getPlayers();
    expect(players.length).to.equal(0); // should reset after winner
    expect(await lottery.round()).to.equal(1);
  });

  it("Prize pool should transfer correctly", async function () {
    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy();
    await lottery.waitForDeployment();

    const signers = await ethers.getSigners();

    const initialBalances: bigint[] = [];
    for (let i = 0; i < 10; i++) {
      initialBalances.push(await ethers.provider.getBalance(signers[i].address));
      await lottery.connect(signers[i]).enter({ value: ethers.parseEther("0.01") });
    }

    const winnerEvent = await lottery.queryFilter("WinnerChosen", -1);
    const winnerAddr = (winnerEvent[0].args as any).winner;

    const finalBalance = await ethers.provider.getBalance(winnerAddr);
    const initialBalance = initialBalances[signers.findIndex(s => s.address === winnerAddr)];

    expect(finalBalance).to.be.greaterThan(initialBalance);
  });
});
