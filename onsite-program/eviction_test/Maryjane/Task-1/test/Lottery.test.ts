import { expect } from "chai";
import { ethers } from "hardhat";

describe("Lottery Contract", function () {
  let lottery: any;
  let owner: any;
  let players: any[];
  const ENTRY_FEE = ethers.parseEther("0.01");

  beforeEach(async function () {
    [owner, ...players] = await ethers.getSigners();
    
    const LotteryFactory = await ethers.getContractFactory("Lottery");
    lottery = await LotteryFactory.deploy();
    await lottery.waitForDeployment();
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      for (let i = 0; i < 3; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }
    });

    it("Should return correct players array", async function () {
      const playerList = await lottery.getPlayers();
      expect(playerList.length).to.equal(3);
      
      for (let i = 0; i < 3; i++) {
        expect(playerList[i]).to.equal(players[i].address);
      }
    });

    it("Should return correct lottery info", async function () {
      const [playerCount, prizePool, round, winner] = await lottery.getLotteryInfo();
      
      expect(Number(playerCount)).to.equal(3);
      expect(prizePool).to.equal(ENTRY_FEE * 3n);
      expect(Number(round)).to.equal(1);
      expect(winner).to.equal(ethers.ZeroAddress);
    });
  });
});
