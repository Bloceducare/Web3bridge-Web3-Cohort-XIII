import { MultiSigWallet } from "../typechain-types";
import { expect } from "chai";
import { Signer } from "ethers";
import { ethers } from "hardhat";

describe("MultiSigWallet Deployment", () => {
  it("should deploy successfully when passed the right parameters", async () => {
    const contractFactory = await ethers.getContractFactory("MultiSigWallet");
    const [deployer, john, james, nobody] = await ethers.getSigners();
    const confirmationThreshold = 2;

    const contractInstance = await contractFactory.deploy(
      [deployer.address, john.address, james.address],
      confirmationThreshold
    );

    await contractInstance.waitForDeployment();

    expect(await contractInstance.i_confirmationThreshold()).to.equal(
      confirmationThreshold
    );
    expect(await contractInstance.isOwner(deployer.address)).to.be.true;
    expect(await contractInstance.isOwner(james.address)).to.be.true;
    expect(await contractInstance.isOwner(john.address)).to.be.true;
    expect(await contractInstance.isOwner(nobody.address)).to.be.false;
  });

  it("should revert if owner array is empty", async () => {
    const contractFactory = await ethers.getContractFactory("MultiSigWallet");
    const confirmationThreshold = 2;

    await expect(
      contractFactory.deploy([], confirmationThreshold)
    ).to.revertedWith("Must pass at least one owner");
  });

  it("should revert if threshold is greater than number of owners", async () => {
    const contractFactory = await ethers.getContractFactory("MultiSigWallet");
    const [deployer, john, james, nobody] = await ethers.getSigners();
    const confirmationThreshold = 6;

    await expect(
      contractFactory.deploy(
        [deployer.address, john.address, james.address],
        confirmationThreshold
      )
    ).to.revertedWith("Threshold cannot be more than the number of owners");
  });

  it("should revert if threshold is 0", async () => {
    const contractFactory = await ethers.getContractFactory("MultiSigWallet");
    const [deployer, john, james, nobody] = await ethers.getSigners();
    const confirmationThreshold = 0;

    await expect(
      contractFactory.deploy(
        [deployer.address, john.address, james.address],
        confirmationThreshold
      )
    ).to.revertedWith("Threshold cannot be 0");
  });
});

describe("MultiSigWallet", () => {
  let MSGinstance: MultiSigWallet;
  let deployer: Signer, john: Signer, james: Signer, nobody: Signer;
  let confirmationThreshold = 2;

  beforeEach("SetUp", async () => {
    // deploy the multi-sig wallet
    const contractFactory = await ethers.getContractFactory("MultiSigWallet");
    [deployer, john, james, nobody] = await ethers.getSigners();
    MSGinstance = await contractFactory.deploy(
      [
        await deployer.getAddress(),
        await john.getAddress(),
        await james.getAddress(),
      ],
      confirmationThreshold
    );
    await MSGinstance.waitForDeployment();
  });

  describe("submitProposal", () => {
    it("should successfully create a proposal", async () => {
      // proposal info
      const value = 1e9; // 1Gwei
      const to = await james.getAddress();

      // create proposal
      await MSGinstance.submitProposal(value, to);

      const proposalID = 0; // id increments by 1 starting from 0
      // get created proposal
      const {
        value: _value,
        to: _to,
        exists,
        executed,
        numberOfConfirmations,
        index,
      } = await MSGinstance.getProposal(proposalID);

      // test proposal values
      expect(value).to.equal(_value);
      expect(to).to.equal(_to);
      expect(exists).to.true;
      expect(executed).to.false;
      expect(numberOfConfirmations).to.equal(0);
      expect(index).to.equal(0);
    });
    it("should successfully emit a Proposal event", async () => {
      // proposal info
      const value = 1e9; // 1Gwei
      const to = james.address;

      // create proposal and test if Proposal event is emitted
      expect(await MSGinstance.submitProposal(value, to))
        .to.emit(MSGinstance, "Proposal")
        .withArgs(0);
    });
  });

  describe("approveProposal", () => {
    it("should successfully approve a transaction", async () => {
      // proposal info
      const value = 1e9; // 1Gwei
      const to = james.address;

      const proposalID = 0; // first proposal is always 0

      // create proposal
      await MSGinstance.submitProposal(value, to);

      // approve proposal
      await MSGinstance.approveProposal(proposalID);

      const { numberOfConfirmations } = await MSGinstance.getProposal(
        proposalID
      );
      const deployerApproved = await MSGinstance.confirmations(
        proposalID,
        deployer.address
      );

      expect(numberOfConfirmations).to.equal(1);
      expect(deployerApproved).to.true;
    });
    it("should emit Approval event", async () => {
      // proposal info
      const value = 1e9; // 1Gwei
      const to = james.address;

      const proposalID = 0; // first proposal is always 0

      // create proposal
      await MSGinstance.submitProposal(value, to);

      // approve and test
      await expect(await MSGinstance.approveProposal(proposalID))
        .to.emit(MSGinstance, "Approval")
        .withArgs(deployer.address, proposalID);
    });
  });

  describe("executeProposal", () => {
    it("should successfully transfer eth from contract's account to james after successful approval", async () => {
      const value = 1e9; // 1Gwei
      const to = await james.getAddress();

      const jamesInitialBalance = await ethers.provider.getBalance(to);

      // create proposal
      await MSGinstance.submitProposal(value, to);
      const proposalID = 0;

      // 2 owners approve the contract
      const approval1 = await MSGinstance.connect(deployer).approveProposal(
        proposalID
      );
      const approval2 = await MSGinstance.connect(john).approveProposal(
        proposalID
      );
      await approval1.wait(); // Add await
      await approval2.wait(); // Add await

      // check the execution status
      const { numberOfConfirmations, executed } = await MSGinstance.getProposal(
        proposalID
      );

      // assert the number of confirmations is 2
      expect(numberOfConfirmations).to.equal(2);
      expect(executed).to.equal(false);

      // give the contract enough ether to pay with
      const fundTx = await deployer.sendTransaction({
        to: await MSGinstance.getAddress(),
        value: ethers.parseEther("10"),
      });
      await fundTx.wait();

      // execute the transaction and test event emission
      await expect(MSGinstance.executeProposal(proposalID))
        .to.emit(MSGinstance, "Execution")
        .withArgs(proposalID);

      // Check balance change
      const jamesCurrentBalance = await ethers.provider.getBalance(
        await james.getAddress()
      );
      const weiDifference = jamesCurrentBalance - jamesInitialBalance;

      // Check execution status
      const { executed: _executed } = await MSGinstance.getProposal(proposalID);

      expect(weiDifference).to.equal(value);
      expect(_executed).to.equal(true);
    });
  });
});
