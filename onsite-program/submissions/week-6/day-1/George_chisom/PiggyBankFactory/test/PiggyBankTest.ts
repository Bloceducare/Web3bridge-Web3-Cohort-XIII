import { expect } from "chai";
import { ethers, network } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Signer, parseEther, parseUnits, ZeroAddress } from "ethers";
import hre from "hardhat";

describe("PiggyBank Test", function () {
  async function deployPiggyBankFixture() {
    const [owner, user, otherAccount]: Signer[] = await hre.ethers.getSigners();

    // Deploy MockERC20
    const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy("Mock Token", "MTK");

    // Deploy PiggyBank
    const PiggyBank = await hre.ethers.getContractFactory("PiggyBank");
    const piggyBank = await PiggyBank.deploy({
      from: await owner.getAddress(),
    });

    return { piggyBank, token, owner, user, otherAccount };
  }

  describe("Savings Account Creation", function () {
    it("Should create a savings account correctly", async function () {
      const { piggyBank, token, user } = await loadFixture(
        deployPiggyBankFixture
      );

      const tokenAddress = await token.getAddress();
      const userAddress = await user.getAddress();

      const tokens: string[] = [tokenAddress];
      const lockPeriods: number[] = [86400]; // 1 day
      const userNames: string[] = ["TestAccount"];

      const tx = await piggyBank
        .connect(user)
        .create_multiple_savings_account(tokens, lockPeriods, userNames);
      await tx.wait();

      const accountCount: bigint =
        await piggyBank.track_user_savingAccount_number(userAddress);

      expect(accountCount).to.equal(1n);
    });
  });

  describe("Deposits and Withdrawals", function () {
    it("Should handle ETH deposit and withdrawal correctly", async function () {
      const { piggyBank, user } = await loadFixture(deployPiggyBankFixture);

      // Create ETH savings account (token address = 0x0)
      const zeroAddress = ZeroAddress;
      await piggyBank
        .connect(user)
        .create_multiple_savings_account(
          [zeroAddress],
          [86400],
          ["ETHAccount"]
        );

      // Deposit 1 ETH
      const depositAmount: bigint = parseEther("1");
      await piggyBank
        .connect(user)
        .save_erc20_or_ethers(0, depositAmount, { value: depositAmount });
      let [accountIds, balances]: [bigint[], bigint[]] = await piggyBank
        .connect(user)
        .user_balance();
      expect(balances[0]).to.equal(depositAmount);

      // Advance time to after lock period
      await network.provider.send("evm_increaseTime", [86400]);
      await network.provider.send("evm_mine");

      // Withdraw 0.5 ETH
      const withdrawAmount: bigint = parseEther("0.5");
      await piggyBank.connect(user).withdraw_funds(0, withdrawAmount);
      [accountIds, balances] = await piggyBank.connect(user).user_balance();
      expect(balances[0]).to.equal(parseEther("0.5"));
    });

    it("Should handle ERC20 deposit and withdrawal with fee", async function () {
      const { piggyBank, token, user, owner } = await loadFixture(
        deployPiggyBankFixture
      );

      const tokenAddress = await token.getAddress();
      await piggyBank
        .connect(user)
        .create_multiple_savings_account(
          [tokenAddress],
          [86400],
          ["TokenAccount"]
        );

      // Mint 1,000,000 tokens to user to ensure sufficient balance
      const initialMint: bigint = parseUnits("1000000", 18);
      await token.connect(user).mint(await user.getAddress(), initialMint);

      // Deposit 1000 tokens
      const depositAmount: bigint = parseUnits("1000", 18);

      const piggyBankAddress = await piggyBank.getAddress();
      await token.connect(user).approve(piggyBankAddress, depositAmount);
      await piggyBank.connect(user).save_erc20_or_ethers(0, depositAmount);
      let [accountIds, balances]: [bigint[], bigint[]] = await piggyBank
        .connect(user)
        .user_balance();
      expect(balances[0]).to.equal(depositAmount);

      // Withdraw 500 tokens before lock period (3% fee)
      const withdrawAmount: bigint = parseUnits("500", 18);

      const fee: bigint = (withdrawAmount * 3n) / 100n;

      const toUser: bigint = withdrawAmount - fee;

      const ownerAddress = await owner.getAddress();

      const userAddress = await user.getAddress();

      const ownerBalanceBefore: bigint = await token.balanceOf(ownerAddress);

      await token.connect(user).approve(piggyBankAddress, withdrawAmount);

      await piggyBank.connect(user).withdraw_funds(0, withdrawAmount);

      [accountIds, balances] = await piggyBank.connect(user).user_balance();

      expect(balances[0]).to.equal(depositAmount - withdrawAmount);

      expect(await token.balanceOf(userAddress)).to.equal(
        initialMint - depositAmount + toUser
      );
      expect(await token.balanceOf(ownerAddress)).to.equal(
        ownerBalanceBefore + fee
      );
    });
  });
});
