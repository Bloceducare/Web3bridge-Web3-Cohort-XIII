import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";
import { parseEther } from "ethers";

describe("Multisig", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployMultisig() {
   

    // Contracts are deployed using the first signer/account by default
    const [owner, signer1, signer2, signer3, signer, recipient] = await hre.ethers.getSigners();
    const Multisig = await hre.ethers.getContractFactory("Multisig");
    const multisig = await Multisig.deploy({ value: hre.ethers.parseEther("100") });

    return { multisig, owner, signer, signer2, signer3, recipient };
  }

  describe("Deployment", function () {
    it("Should get true for deployer as signer", async function () {
      const { multisig, owner, signer, signer2, signer3, recipient } = await loadFixture(deployMultisig);
      expect(await multisig.getSignerStatus(owner.address)).to.be.true;
      
    });


    it("Should get false for address that has not been added as signer", async function () {
      const { multisig, owner, signer, signer2, signer3, recipient } = await loadFixture(deployMultisig);
      expect(await multisig.getSignerStatus(signer.address)).to.be.false;
    });


    it("Should add new address as signer", async function () {
      const { multisig, owner, signer, signer2, signer3, recipient } = await loadFixture(deployMultisig);
      await multisig.setSigner(signer.address, true)
      expect(await multisig.getSignerStatus(signer.address)).to.be.true;
    });

    it("should allow only owner to set signers", async function () {
      const { multisig, owner, signer, signer2, signer3, recipient } = await loadFixture(deployMultisig);
      await expect(multisig.connect(signer).setSigner(signer2.address, true)).to.be.revertedWith('only owner can make this transaction')
    })

    it("Should remove address as signer", async function () {
      const { multisig, owner, signer, signer2, signer3, recipient } = await loadFixture(deployMultisig);
      await multisig.setSigner(signer.address, true)
      expect(await multisig.getSignerStatus(signer.address)).to.be.true;
      await multisig.setSigner(signer.address, false)
      expect(await multisig.getSignerStatus(signer.address)).to.be.false;
    });

    it("create new proposal", async function () {
      const { multisig, owner, signer, signer2, signer3, recipient } = await loadFixture(deployMultisig);
      // await multisig.makeProposal(recipient.address,hre.ethers.parseEther("10"))
      expect(await multisig.makeProposal.staticCall(recipient.address,hre.ethers.parseEther("10"))).to.be.equal(0);
      await multisig.makeProposal(recipient.address,hre.ethers.parseEther("10"))
      expect(await multisig.makeProposal.staticCall(recipient.address,hre.ethers.parseEther("10"))).to.be.equal(1);
    })

    it("should get a proposal by Id", async function () {
      const { multisig, owner, signer, signer2, signer3, recipient } = await loadFixture(deployMultisig);
      const proposal = await multisig.makeProposal.staticCall(recipient.address,hre.ethers.parseEther("10"));
      await multisig.makeProposal(recipient.address,hre.ethers.parseEther("10"))
      expect((await multisig.getProposal(0)).signatureCount).to.be.equal(1n);
    })

    it("should sign a proposal", async function () {
      const { multisig, owner, signer, signer2, signer3, recipient } = await loadFixture(deployMultisig);
      const proposal = await multisig.makeProposal.staticCall(recipient.address,hre.ethers.parseEther("10"));
      await multisig.makeProposal(recipient.address,hre.ethers.parseEther("10"))
      await multisig.setSigner(signer.address, true);
      await multisig.connect(signer).signProposal(0);
      expect((await multisig.getProposal(0)).signatureCount).to.be.equal(2)
    })

    it("should not sign a proposal is address is not a signer", async function () {
      const { multisig, owner, signer, signer2, signer3, recipient } = await loadFixture(deployMultisig);
      await multisig.makeProposal(recipient.address,hre.ethers.parseEther("10"))
      await expect(multisig.connect(signer).signProposal(0)).to.be.revertedWith('only a signer can make this transaction');
    })

    it("should not sign a proposal if it has been approved", async function () {
      const { multisig, owner, signer, signer2, signer3, recipient } = await loadFixture(deployMultisig);
      await multisig.makeProposal(recipient.address,hre.ethers.parseEther("10"))
      await multisig.setSigner(signer.address, true);
      await multisig.setSigner(signer2.address, true);
      await multisig.setSigner(signer3.address, true);
      await multisig.connect(signer).signProposal(0)
      await multisig.connect(signer2).signProposal(0)
      await expect(multisig.connect(signer3).signProposal(0)).to.be.revertedWith("Proposal has been approved")
     })

      it("should not sign a proposal if address has previously signed it ", async function () {
      const { multisig, owner, signer, signer2, signer3, recipient } = await loadFixture(deployMultisig);
      await multisig.makeProposal(recipient.address,hre.ethers.parseEther("10"))
      await multisig.setSigner(signer.address, true);
      await multisig.connect(signer).signProposal(0)
      await expect(multisig.connect(signer).signProposal(0)).to.be.revertedWith("You've signed this proposal")
     })

     
     it("should transfer ether if proposal has been signed three times", async function () {
      const { multisig, owner, signer, signer2, signer3, recipient } = await loadFixture(deployMultisig);
      const amount = hre.ethers.parseEther("10");
      const initialRecipientBalance = await hre.ethers.provider.getBalance(recipient.address);
      await multisig.makeProposal(recipient.address,hre.ethers.parseEther("10"))
      await multisig.setSigner(signer.address, true);
      await multisig.setSigner(signer2.address, true);
      await multisig.setSigner(signer3.address, true);
      await multisig.connect(signer).signProposal(0)
      await multisig.connect(signer2).signProposal(0)
      const currentRecipientBalance = await hre.ethers.provider.getBalance(recipient.address)
      expect(currentRecipientBalance - initialRecipientBalance).to.be.equal(amount)
     })


   
  });

  
});
