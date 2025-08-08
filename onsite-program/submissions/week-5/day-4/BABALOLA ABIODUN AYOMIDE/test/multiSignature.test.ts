import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Signer, Contract } from "ethers";

describe("MultiSgnature wallet Implementation", () => {
  let deployedContract: Contract;
  let owner1: Signer,
    owner2: Signer,
    owner3: Signer,
    owner4: Signer,
    owner6:Signer,
    owner5: Signer;
  async function deployContract() {
    const initialContract = await hre.ethers.getContractFactory("MultiSignatureWallet");
    [owner1, owner2, owner3, owner4, owner5,owner6 ]= await hre.ethers.getSigners();
      deployedContract = await initialContract.deploy([owner1.address, owner2.address,
          owner3.address, owner4.address, owner5.address]);
    return { deployedContract, owner1, owner2, owner3, owner4, owner5,owner6 };
  }
  describe("transction creation and approval", () => {
      it("test transaction can be created", async () => {
          const { deployedContract,  owner5 } = await loadFixture(deployContract);
          const contractAddress = await deployedContract.getAddress();
          const amount = hre.ethers.parseEther("2");
          owner1.sendTransaction({
              to: contractAddress,
              value: amount
          })
          const transferAmount = hre.ethers.parseEther("0.5");
          await deployedContract.createTransferProposal(await owner5.getAddress(), transferAmount);
          const allTransactions = await deployedContract.getAllTransactions();
          expect(allTransactions.length).to.equal(1);
      });
       it("test transaction can be approved", async () => {
          const { deployedContract,  owner5,owner6 } = await loadFixture(deployContract);
          const contractAddress = await deployedContract.getAddress();
          const amount = hre.ethers.parseEther("2");
          owner1.sendTransaction({
              to: contractAddress,
              value: amount
          })
          const transferAmount = hre.ethers.parseEther("0.5");
          await deployedContract.createTransferProposal(await owner5.getAddress(), transferAmount);
          let allTransactions = await deployedContract.getAllTransactions();
           expect(allTransactions.length).to.equal(1);
           await expect(deployedContract.connect(owner6).approveTransaction(allTransactions[0].transactionId))
                 .to.be.revertedWithCustomError(deployedContract, "UNAUTHORIZED");
           await deployedContract.connect(owner2).approveTransaction(allTransactions[0].transactionId);
           allTransactions = await deployedContract.getAllTransactions();
           expect(allTransactions[0].approvals.length).to.equal(2);
       });
      it("tests transfer is done until at least 3 users approves it", async () => {
          const { deployedContract, owner5, owner1, owner3, owner2 } = await loadFixture(deployContract);
          
          const contractAddress = await deployedContract.getAddress();
          const amount = hre.ethers.parseEther("2");
          await owner1.sendTransaction({ to: contractAddress, value: amount })
          const initialBalance = await hre.ethers.provider.getBalance(owner2.address)
          const transferAmount = hre.ethers.parseEther("0.5");
          await deployedContract.createTransferProposal(await owner2.getAddress(), transferAmount);
          let allTransactions = await deployedContract.getAllTransactions();

          await deployedContract.connect(owner3).approveTransaction(allTransactions[0].transactionId);
          allTransactions = await deployedContract.getAllTransactions();

          allTransactions = await deployedContract.getAllTransactions();
          expect(allTransactions[0].status).to.equal(0);

          await deployedContract.connect(owner4).approveTransaction(allTransactions[0].transactionId);
          allTransactions = await deployedContract.getAllTransactions();
          expect(allTransactions[0].approvals.length).to.equal(3);
          expect(allTransactions[0].status).to.equal(1);
          const contractBalance = await hre.ethers.provider.getBalance(contractAddress);

          expect(contractBalance).to.equal(hre.ethers.parseEther("1.5"));

          const userAddress = await owner2.address;
          const userBalance = await hre.ethers.provider.getBalance(userAddress);
          expect(userBalance).not.to.equal(initialBalance);
      });
      it("should deploy a new wallet and store in factory", async () => {
            const Factory = await ethers.getContractFactory("WalletFactory");
            const factory = await Factory.deploy();

            const [owner1, owner2, owner3,owner4] = await ethers.getSigners();
            const addresses = [owner1.address, owner2.address, owner3.address,owner4.address];

            await factory.createWallet(addresses);

            const wallets = await factory.getAllContracts();
            expect(wallets.length).to.equal(1);
      });
  });
});
