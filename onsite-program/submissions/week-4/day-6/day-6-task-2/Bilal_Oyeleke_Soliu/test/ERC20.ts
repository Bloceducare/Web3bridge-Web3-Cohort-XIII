import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Erc20Token", () => {
  async function deployContract() {
    const [owner, otherAccount] = await ethers.getSigners(); 
    const MyContract = await ethers.getContractFactory("ERC20Token");
    const name = "TestToken";
    const symbol = "TTK";
    const decimals = 18;
    const ownerAddress = owner.address;
    const deployedContract = await MyContract.deploy(name, symbol, decimals, ownerAddress);
    return { deployedContract, owner, otherAccount };
  }


  // Test totalSupply, mint, and burn
  describe("Test function totalSupply, Mint and Burn", () => {
    it("Should return 0 for total supply by default", async () => {
      const { deployedContract: contract } = await loadFixture(deployContract);
      expect(await contract._totalSupply()).to.equal(0);
    });

    it("Should update totalSupply when token is minted or burned", async () => {
      const { deployedContract: contract, owner } = await loadFixture(deployContract);
      await contract.mint(owner.address, 70);
      expect(await contract._totalSupply()).to.equal(70);
      await contract.burn(50);
      expect(await contract._totalSupply()).to.equal(20);
    });

    it("Should revert mint if caller is not owner", async () => {
      const { deployedContract: contract, otherAccount } = await loadFixture(deployContract);
      await expect(
        contract.connect(otherAccount).mint(otherAccount.address, 50)
      ).to.be.revertedWithCustomError(contract, "ONLY_OWNER_CAN_CALL_THIS_FUNCTION");
    });

    it("Should revert burn if caller is not owner", async () => {
      const { deployedContract: contract, otherAccount } = await loadFixture(deployContract);
      await expect(
        contract.connect(otherAccount).burn(10)
      ).to.be.revertedWithCustomError(contract, "ONLY_OWNER_CAN_CALL_THIS_FUNCTION");
    });
  });


  // Test balanceOf
  describe("Test function balanceOf(), mint() and burn()", () => {
    it("Should return 0 for balanceOf by default", async () => {
      const { deployedContract: contract, owner } = await loadFixture(deployContract);
      expect(await contract.balanceOf(owner.address)).to.equal(0);
    });

    it("Should update balanceOf when token is minted or burned", async () => {
      const { deployedContract: contract, owner } = await loadFixture(deployContract);
      await contract.mint(owner.address, 70);
      expect(await contract.balanceOf(owner.address)).to.equal(70);
      await contract.burn(50);
      expect(await contract.balanceOf(owner.address)).to.equal(20);
    });
  });


  // Test transfer
  describe("Transfer function", function () {
    it("Should transfer tokens between accounts", async function () {
      const { deployedContract: contract, owner, otherAccount } = await loadFixture(deployContract);

      // Mint tokens so owner has balance
      await contract.mint(owner.address, ethers.parseUnits("1000", 18));

      const ownerInitialBalance = await contract.balanceOf(owner.address);
      const receiverInitialBalance = await contract.balanceOf(otherAccount.address);

      const transferAmount = ethers.parseUnits("100", 18);
      await contract.transfer(otherAccount.address, transferAmount);

      const ownerFinalBalance = await contract.balanceOf(owner.address);
      const receiverFinalBalance = await contract.balanceOf(otherAccount.address);

      expect(ownerFinalBalance).to.equal(ownerInitialBalance - transferAmount);
      expect(receiverFinalBalance).to.equal(receiverInitialBalance + transferAmount);
    });

    it("Should revert if sender has insufficient balance", async function () {
      const { deployedContract: contract, otherAccount } = await loadFixture(deployContract);

      const transferAmount = ethers.parseUnits("50", 18);
      await expect(
        contract.connect(otherAccount).transfer(ethers.ZeroAddress, transferAmount)
      ).to.be.revertedWithCustomError(contract, "NOT_ENOUGH_FUND");
    });
  });


  // Test approve and allowance
  describe("Test approve() and allowance()", function () {
    it("Should set allowance for spender", async function () {
      const { deployedContract: contract, owner, otherAccount } = await loadFixture(deployContract);
      await contract.mint(owner.address, ethers.parseUnits("500", 18));

      await contract.approve(otherAccount.address, ethers.parseUnits("100", 18));
      expect(await contract.allowance(owner.address, otherAccount.address))
        .to.equal(ethers.parseUnits("100", 18));
    });
  });


  // Test transferFrom
  describe("Test transferFrom()", function () {
    it("Should transfer tokens using allowance", async function () {
      const { deployedContract: contract, owner, otherAccount } = await loadFixture(deployContract);

      await contract.mint(owner.address, ethers.parseUnits("500", 18));
      await contract.approve(otherAccount.address, ethers.parseUnits("100", 18));

      await contract.connect(otherAccount).transferFrom(
        owner.address,
        otherAccount.address,
        ethers.parseUnits("50", 18)
      );

      expect(await contract.balanceOf(owner.address)).to.equal(ethers.parseUnits("450", 18));
      expect(await contract.balanceOf(otherAccount.address)).to.equal(ethers.parseUnits("50", 18));
      expect(await contract.allowance(owner.address, otherAccount.address)).to.equal(ethers.parseUnits("50", 18));
    });

    it("Should revert if transferFrom amount exceeds allowance", async function () {
      const { deployedContract: contract, owner, otherAccount } = await loadFixture(deployContract);

      await contract.mint(owner.address, ethers.parseUnits("500", 18));
      await contract.approve(otherAccount.address, ethers.parseUnits("50", 18));

      await expect(
        contract.connect(otherAccount).transferFrom(
          owner.address,
          otherAccount.address,
          ethers.parseUnits("100", 18)
        )
      ).to.be.revertedWithCustomError(contract, "ALLOWANCE_TOO_LOW");
    });

    it("Should revert if transferFrom amount exceeds balance", async function () {
      const { deployedContract: contract, owner, otherAccount } = await loadFixture(deployContract);

      await contract.approve(otherAccount.address, ethers.parseUnits("50", 18));

      await expect(
        contract.connect(otherAccount).transferFrom(
          owner.address,
          otherAccount.address,
          ethers.parseUnits("50", 18)
        )
      ).to.be.revertedWithCustomError(contract, "NOT_ENOUGH_FUND");
    });
  });
});
