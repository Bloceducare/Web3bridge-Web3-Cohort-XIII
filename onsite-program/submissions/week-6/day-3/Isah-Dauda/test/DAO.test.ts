import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import hre from "hardhat";
// ... imports

describe("Advanced DAO Workflow", function () {
  async function deployAdvancedFixture() {
    // ... setup code to deploy, mint NFTs, and grant roles ...
    // ... create a simple Target contract to be called by proposals
    const TargetContract = await hre.ethers.getContractFactory("Target");
    const target = await TargetContract.deploy();
    return { /* ...other variables... */, target };
  }

  it("Should successfully execute a proposal through the full lifecycle", async function () {
    const { dao, timelock, member1, member1TokenId, target } = await loadFixture(deployAdvancedFixture);

    // 1. Create Proposal to call `setValue(42)` on the Target contract
    const targetInterface = new hre.ethers.Interface(["function setValue(uint256)"]);
    const calldata = targetInterface.encodeFunctionData("setValue", [42]);
    await dao.connect(member1).createProposal([await target.getAddress()], [0], [calldata], "Set Target Value", member1TokenId);
    
    // 2. Vote
    await dao.connect(member1).vote(0, true, member1TokenId);
    // ... more votes to meet quorum ...

    // 3. Fast-forward past voting period
    await hre.network.provider.send("evm_increaseTime", [VOTING_PERIOD * 12 + 1]);
    await hre.network.provider.send("evm_mine");

    // 4. Queue the proposal in the Timelock
    await expect(dao.connect(member1).queue(0)).to.emit(timelock, "CallScheduled");

    // 5. Fast-forward past the timelock delay
    await hre.network.provider.send("evm_increaseTime", [TIMELOCK_MIN_DELAY + 1]);
    await hre.network.provider.send("evm_mine");

    // 6. Execute the proposal
    await expect(dao.connect(member1).execute(0)).to.emit(timelock, "CallExecuted");

    // 7. Verify the state change on the target contract
    expect(await target.value()).to.equal(42);
  });
});