import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";



describe("Lottery", function () {
  async function deployLotteryFixture() {
    const [owner, player1, player2, player3, ...others] = await hre.ethers.getSigners();

    const Lottery = await hre.ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy();

    return {lottery, owner, player1, player2, player3, others};
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const {lottery, owner} = await loadFixture(deployLotteryFixture);
      expect(await lottery.owner()).to.equal(owner.address);
    });

    it("Should set entry fee to 0.1 ether", async function () {
      const {lottery} = await loadFixture(deployLotteryFixture);
      expect(await lottery.entryFee()).to.equal(hre.ethers.parseEther("0.1"));
    });
  });

  describe("Entering the lottery", function () {
    it("Should revert if entry fee is incorrect", async function () {
      const {lottery, player1} = await loadFixture(deployLotteryFixture);

      await expect(
          lottery.connect(player1).enter({value: hre.ethers.parseEther("0.05")})
      ).to.be.revertedWithCustomError(lottery, "INCORRECT_ENTRY_FEE");
    });

    it("Should allow a player to enter", async function () {
      const {lottery, player1} = await loadFixture(deployLotteryFixture);

      await expect(lottery.connect(player1).enter({value: hre.ethers.parseEther("0.1")}))
          .to.emit(lottery, "PlayerEntered")
          .withArgs(player1.address, hre.ethers.parseEther("0.1"));

      expect(await lottery.playersCount()).to.equal(1);
      expect(await lottery.getPlayer(0)).to.equal(player1.address);
    });

    it("Should not allow same player to enter twice in the same round", async function () {
      const {lottery, player1} = await loadFixture(deployLotteryFixture);

      await lottery.connect(player1).enter({value: hre.ethers.parseEther("0.1")});

      await expect(
          lottery.connect(player1).enter({value: hre.ethers.parseEther("0.1")})
      ).to.be.revertedWithCustomError(lottery, "ALREADY_ENTERED_THIS_ROUND");
    });
  });

  describe("Picking a winner", function () {
    it("Should revert if no players entered", async function () {
      const {lottery} = await loadFixture(deployLotteryFixture);

      await expect(lottery._pickWinner()).to.be.revertedWithCustomError(
          lottery,
          "NO_PLAYERS_FOUND"
      );
    });

    it("Should pick a winner and reset players", async function () {
      const {lottery, player1, player2, player3} = await loadFixture(deployLotteryFixture);


      await lottery.connect(player1).enter({value: hre.ethers.parseEther("0.1")});
      await lottery.connect(player2).enter({value: hre.ethers.parseEther("0.1")});
      await lottery.connect(player3).enter({value: hre.ethers.parseEther("0.1")});

      const prizePool = await lottery.prizePool();


      await expect(lottery._pickWinner())
          .to.emit(lottery, "WinnerPicked")
          .withArgs(anyValue, prizePool, 0);

      expect(await lottery.playersCount()).to.equal(0);
      expect(await lottery.round()).to.equal(1);
    });
  });
});




