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
    owner5: Signer;
  async function deployContract() {
    const initialContract = await hre.ethers.getContractFactory("MultiSignatureWallet");
    [owner1, owner2, owner3, owner4, owner5 ]= await hre.ethers.getSigners();
    deployedContract = await initialContract.deploy([await owner1.getAddress(), await owner2.getAddress(), await owner3.getAddress(), await owner4.getAddress()]);
    return { deployedContract, owner1, owner2, owner3, owner4, owner5 };
  }
  describe("transction approval", () => {
      it("test transaction can be approved ny different users", async () => {
          const contractAddress = await deployedContract.getAddress();
          const amount = hre.ethers.parseEther("2");
          owner1.sendTransaction({
              to: contractAddress,
              value: amount
          })
          const transferAmount = hre.ethers.parseEther("0.5");
          const contractStatus = await deployedContract.connect(owner1).transfer(transferAmount, owner5.getAddress());
          expect(contractStatus).to.equal(0);
    });
  });
});
