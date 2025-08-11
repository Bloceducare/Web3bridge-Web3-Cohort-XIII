import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";
import { PiggyBank as PiggyBankType } from "../typechain-types";

async function deployPiggyBankFixture() {
  const [owner, addr1, addr2] = await hre.ethers.getSigners();

  const Factory = await hre.ethers.getContractFactory("Factory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();

  const tx = await factory.connect(owner).createPiggyBank(
    hre.ethers.ZeroAddress,
    60 * 60 * 24
  );

  const receipt = await tx.wait();
  if (!receipt) throw new Error("Transaction receipt not found");

  const factoryAddress = typeof factory.target === "string"
    ? factory.target
    : factory.target.toString();

  let piggyBankAddress: string | undefined;

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() === factoryAddress.toLowerCase()) {
      try {
        const parsedLog = factory.interface.parseLog({
          topics: log.topics,
          data: log.data,
        });

        if (parsedLog && parsedLog.name === "SavingsCreated") {
          piggyBankAddress = parsedLog.args.child;
          break;
        }
      } catch {}
    }
  }

  if (!piggyBankAddress) {
    throw new Error("SavingCreated event not found");
  }

  const PiggyBank = await hre.ethers.getContractFactory("PiggyBank");
  const piggyBank = PiggyBank.attach(piggyBankAddress) as PiggyBankType;

  return { owner, addr1, addr2, factory, piggyBank };
}

describe("PiggyBank", function () {
  it("should deploy PiggyBank via Factory", async function () {
    const { piggyBank } = await deployPiggyBankFixture();
    expect(await piggyBank.owner()).to.not.equal(hre.ethers.ZeroAddress);
  });

  it("should set the correct owner", async function () {
    const { piggyBank, owner } = await deployPiggyBankFixture();
    expect(await piggyBank.owner()).to.equal(owner.address);
  });

  it("should start with zero balance", async function () {
    const { piggyBank } = await deployPiggyBankFixture();
    expect(await piggyBank.getBalance()).to.equal(0);
  });

  it("should revert withdraw if called by non-owner", async function () {
    const { piggyBank, addr1 } = await deployPiggyBankFixture();
    await expect(
      piggyBank.connect(addr1).withdraw(100)
    ).to.be.revertedWithCustomError(
      piggyBank,
      "UNAUTHORIZED_TO_PERFORM_TRANSACTION"
    );
  });
});


