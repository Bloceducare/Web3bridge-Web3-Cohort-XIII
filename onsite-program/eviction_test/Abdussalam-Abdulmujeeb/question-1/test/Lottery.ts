import { expect } from "chai";
import { ethers } from "hardhat";
import { Lottery } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Lottery Contract", function () {
  let lottery: Lottery;
  let owner: HardhatEthersSigner;
  let players: HardhatEthersSigner[];
  const LOTTERY_PRICE = ethers.parseEther("0.01");

  beforeEach(async function () {
    // Get signers
    [owner, ...players] = await ethers.getSigners();
    
    // Deploy contract
    const LotteryFactory = await ethers.getContractFactory("Lottery");
    lottery = await LotteryFactory.deploy(LOTTERY_PRICE);
    await lottery.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy with correct lottery price", async function () {
      // We can't directly access lotteryPrice since it's not a public getter
      // But we can test it indirectly by trying to join with the correct price
      await expect(
        lottery.connect(players[0]).joinLottery({ value: LOTTERY_PRICE })
      ).to.not.be.reverted;
    });

    it("Should start with lottery active", async function () {
      // Test that we can join (indicating lottery is active)
      await expect(
        lottery.connect(players[0]).joinLottery({ value: LOTTERY_PRICE })
      ).to.not.be.reverted;
    });
  });

  describe("Joining Lottery", function () {
    it("Should allow player to join with correct entry fee", async function () {
      await expect(
        lottery.connect(players[0]).joinLottery({ value: LOTTERY_PRICE })
      ).to.not.be.reverted;
    });

    it("Should revert if entry fee is incorrect", async function () {
      const wrongPrice = ethers.parseEther("0.02");
      await expect(
        lottery.connect(players[0]).joinLottery({ value: wrongPrice })
      ).to.be.revertedWithCustomError(lottery, "Entry_fee_must_be_exactly_001_ETH");
    });

    it("Should revert if player tries to join twice", async function () {
      // First join should succeed
      await lottery.connect(players[0]).joinLottery({ value: LOTTERY_PRICE });
      
      // Second join should fail
      await expect(
        lottery.connect(players[0]).joinLottery({ value: LOTTERY_PRICE })
      ).to.be.revertedWithCustomError(lottery, "You_have_already_joined_this_round");
    });

    it("Should allow multiple different players to join", async function () {
      for (let i = 0; i < 5; i++) {
        await expect(
          lottery.connect(players[i]).joinLottery({ value: LOTTERY_PRICE })
        ).to.not.be.reverted;
      }
    });

    it("Should accumulate ETH in contract as players join", async function () {
      const initialBalance = await ethers.provider.getBalance(await lottery.getAddress());
      
      await lottery.connect(players[0]).joinLottery({ value: LOTTERY_PRICE });
      await lottery.connect(players[1]).joinLottery({ value: LOTTERY_PRICE });
      
      const finalBalance = await ethers.provider.getBalance(await lottery.getAddress());
      expect(finalBalance - initialBalance).to.equal(LOTTERY_PRICE * 2n);
    });
  });

  describe("Winner Selection", function () {
    it("Should automatically select winner when 10th player joins", async function () {
      // Add 9 players
      for (let i = 0; i < 9; i++) {
        await lottery.connect(players[i]).joinLottery({ value: LOTTERY_PRICE });
      }
      
      // 10th player should trigger winner selection
      await expect(
        lottery.connect(players[9]).joinLottery({ value: LOTTERY_PRICE })
      ).to.emit(lottery, "WinnerEvent");
    });

    it("Should transfer all funds to winner", async function () {
      // Add 10 players
      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).joinLottery({ value: LOTTERY_PRICE });
      }
      
      // Contract should have no balance after winner selection
      const contractBalance = await ethers.provider.getBalance(await lottery.getAddress());
      expect(contractBalance).to.equal(0);
    });

    it("Should reset lottery after winner selection", async function () {
      // Add 10 players to trigger winner selection
      for (let i = 0; i < 10; i++) {
        await lottery.connect(players[i]).joinLottery({ value: LOTTERY_PRICE });
      }
      
      // Should be able to join new round
      await expect(
        lottery.connect(players[0]).joinLottery({ value: LOTTERY_PRICE })
      ).to.not.be.reverted;
    });
  });

  });

