import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import hre from "hardhat";

describe("Lottery", function () {
  async function deployLottery() {
    const [owner, ...addresses] = await hre.ethers.getSigners();

    const lottery = await hre.ethers.getContractFactory("Lottery");
    const lotteryInstance = await lottery.deploy([owner.address, ...addresses]);

    return {
      lotteryInstance,
      owner,
      ...addresses,
    };
  }

  describe("deployment", function () {
    it("should deploy the contract and set the correct owner", async function () {
      const { lotteryInstance, owner } = await loadFixture(deployLottery);

      expect(await lotteryInstance.getAddress()).to.be.properAddress;
    });
  });

  describe("Entry", function () {
    it("should revert if fee is not 0.01 ETH", async function () {
      const { lotteryInstance, owner } = await loadFixture(deployLottery);

      await expect(
        lotteryInstance
          .connect(owner)
          .joinLottery({ value: ethers.parseEther("0.1") })
      ).to.be.revertedWith("Entry fee is 0.01 ETH");
    });
    it("should enter with fee of 0.01 ETH", async function () {
      const { lotteryInstance, owner } = await loadFixture(deployLottery);

      await expect(
        lotteryInstance
          .connect(owner)
          .joinLottery({ value: ethers.parseEther("0.01") })
      ).to.be.fulfilled;
    });
    it("Should allow multiple players to join", async function () {
      const { lotteryInstance, owner, ...addresses } = await loadFixture(deployLottery);
      for (let i = 0; i < 3; i++) {
        await lotteryInstance.connect(addresses[i]).joinLottery({ value: ethers.parseEther("0.01") });
      }
      expect(await lotteryInstance.getAllParticipants()).to.have.lengthOf(3);
    });
  });

  

   describe("Security Considerations", function () {
    
    it("Should prevent re-entry in the same round", async function () {
      const { lotteryInstance, owner, ...addresses } = await loadFixture(deployLottery);
      await lotteryInstance.connect(addresses[1]).joinLottery({ value: ethers.parseEther("0.01") });
      await expect(lotteryInstance.connect(addresses[1]).joinLottery({ value: ethers.parseEther("0.01") }))
        .to.be.revertedWith("You have already joined this round");
    });
  });
});
