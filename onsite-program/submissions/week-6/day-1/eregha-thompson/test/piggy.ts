import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";


import hre from "hardhat";
import { PiggyToken } from "../typechain-types";


describe("Piggy vest", function () {
  async function deployPiggyVest() {
    const [owner, otherAddress, thirdAddress] = await hre.ethers.getSigners();

    const Token = await ethers.getContractFactory("piggyToken");
    const token = (await Token.deploy(
      ethers.parseEther("1000")
    )) as unknown as PiggyToken;
    await token.waitForDeployment();

    const Piggy = await hre.ethers.getContractFactory("Savings_Account");
    const piggy = await Piggy.deploy(
      "testing",
      true,
      3600,
      owner.address,
      otherAddress.address,
      await token.getAddress()
    );
    const piggyToken = await Piggy.deploy(
      "testing",
      false,
      3600,
      owner.address,
      otherAddress.address,
      await token.getAddress()
    );

    return { piggy, piggyToken, token, owner, otherAddress, thirdAddress };
  }

  describe("Deloyment", function () {
    it("should deploy succesfully", async function () {
      const { piggy } = await loadFixture(deployPiggyVest);
      expect(await piggy.getAddress()).to.be.properAddress;
    });
  });

  describe("deposit ether", function () {
    it("should deposit ether to the address", async function () {
      const { piggy, owner } = await loadFixture(deployPiggyVest);

      const depositAmount = hre.ethers.parseEther("1");
      await piggy.connect(owner).deposit({
        value: depositAmount,
      });

      const balance = await hre.ethers.provider.getBalance(piggy.getAddress());
      expect(balance).to.equal(depositAmount);
    });
    it("should not deposit if not owner", async function () {
      const { piggy, owner, otherAddress, thirdAddress } = await loadFixture(
        deployPiggyVest
      );

      const depositAmount = hre.ethers.parseEther("1");
      await expect(
        piggy.connect(thirdAddress).deposit({
          value: depositAmount,
        })
      ).to.be.revertedWith("You are not the owner of this account.");
    });
    it("should not deposit if amount is zero", async function () {
      const { piggy, owner, otherAddress } = await loadFixture(deployPiggyVest);

      const depositAmount = hre.ethers.parseEther("0");
      await expect(
        piggy.connect(owner).deposit({
          value: depositAmount,
        })
      ).to.be.revertedWith("Value must be greater than 0");
    });
  });

  describe("withdraw ether", function () {
    it("should not withdraw if amount greater than balance", async function () {
      const { piggy, owner } = await loadFixture(deployPiggyVest);

      const depositAmount = hre.ethers.parseEther("1");
      await piggy.connect(owner).deposit({
        value: depositAmount,
      });

      const initial_balance = await hre.ethers.provider.getBalance(
        piggy.getAddress()
      );
      const withdrawAmount = hre.ethers.parseEther("2");
      await expect(
        piggy.connect(owner).withdraw(withdrawAmount)
      ).to.be.revertedWith("invalid amount");
    });
    it("should not withdraw if not owner", async function () {
      const { piggy, owner, otherAddress } = await loadFixture(deployPiggyVest);

      const depositAmount = hre.ethers.parseEther("1");
      await piggy.connect(owner).deposit({
        value: depositAmount,
      });

      const withdrawAmount = hre.ethers.parseEther("1");
      await expect(
        piggy.connect(otherAddress).withdraw(withdrawAmount)
      ).to.be.revertedWith("You are not the owner of this account.");
    });
    it("should send break out fee to admin", async function () {
      const { piggy, owner, otherAddress } = await loadFixture(deployPiggyVest);

      const depositAmount = hre.ethers.parseEther("1");
      await piggy.connect(owner).deposit({
        value: depositAmount,
      });

      const initial_Admin = await hre.ethers.provider.getBalance(
        otherAddress.getAddress()
      );

      const withdrawAmount = hre.ethers.parseEther("1");
      await piggy.connect(owner).withdraw(withdrawAmount);
      const final_Admin = await hre.ethers.provider.getBalance(
        otherAddress.getAddress()
      );
      const expectedFee = hre.ethers.parseEther("0.03");
      expect(final_Admin - initial_Admin).to.be.equal(expectedFee);
    });
   
  });

  describe("deposit ERC20", function () {
    it("should deposit erc20", async function () {
      const { piggy, owner, piggyToken, otherAddress, token } =
        await loadFixture(deployPiggyVest);

      const ownerBalance = await token.balanceOf(owner.address);

      console.log(ethers.formatUnits(ownerBalance));

      await token
        .connect(owner)
        .approve(piggyToken.target, ethers.parseEther("30000000"));
      await piggyToken.connect(owner).depositTokens(ethers.parseEther("50"));
      expect(await token.balanceOf(piggyToken.target)).to.equal(
        ethers.parseEther("50")
      );
    });
    it("only owner can send", async function () {
      const { piggy, owner, piggyToken, otherAddress, token } =
        await loadFixture(deployPiggyVest);

      const ownerBalance = await token.balanceOf(owner.address);

      console.log(ethers.formatUnits(ownerBalance));

      await token
        .connect(owner)
        .approve(piggyToken.target, ethers.parseEther("300"));
      await expect(
        piggyToken.connect(otherAddress).depositTokens(ethers.parseEther("50"))
      ).to.revertedWith("You are not the owner of this account.");
     
    });
    it("should send break out fee token to admin", async function () {
       const { piggy, owner, piggyToken, otherAddress, token } =
        await loadFixture(deployPiggyVest);

      const ownerBalance = await token.balanceOf(owner.address);

      console.log(ethers.formatUnits(ownerBalance));

      await token
        .connect(owner)
        .approve(piggyToken.target, ethers.parseEther("30000000"));
      await piggyToken.connect(owner).depositTokens(ethers.parseEther("50"));

      const ownerBalance2 = await token.balanceOf(owner.address);

      console.log(ethers.formatUnits(ownerBalance2));

     
      await piggyToken.connect(owner).withdrawTokens(ethers.parseEther("30"));
      const ownerBalance3 = await token.balanceOf(owner.address);

      console.log(ethers.formatUnits(ownerBalance3));
      const final_Admin = await token.balanceOf(otherAddress.address);
      console.log("final admin address", ethers.formatUnits(final_Admin));
      
      const piggyTokenbalance = await token.balanceOf(piggyToken.target);
      console.log("contract balance", piggyTokenbalance);
      expect(piggyTokenbalance).to.be.equal(ethers.parseEther("20"))
      
      expect(final_Admin ).to.be.equal(ethers.parseEther("0.9"));
    });
  });
});
