import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
// import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("MoviesToken contract test suite", () => {
    async function deployMoviewContract() {
        const MoviesToken = await hre.ethers.getContractFactory("MoviesToken");
        const contractDeployed = await MoviesToken.deploy("TokenName", "TKN", 100000000);
        const [acc1, acc2, acc3] = await hre.ethers.getSigners();
        return { contractDeployed, acc1, acc2, acc3};
    }
    
    describe("state variables are initialized after deployment", async () => {
        it("should return the correct token name", async () => {
            const {contractDeployed} = await loadFixture(deployMoviewContract);
            expect(await contractDeployed.name()).to.equal("TokenName");
        });
        it("should get the total supply of the contract after deployment", async () => {
            const {contractDeployed} = await loadFixture(deployMoviewContract);
            expect(await contractDeployed.symbol()).to.equal("TKN");
        });
        it("should get the total supply of the contract after deployment", async () => {
            const {contractDeployed} = await loadFixture(deployMoviewContract);
            expect(await contractDeployed.totalSupply()).to.equal(100000000);
        });
    })

    describe("cnotract token can be gotten", async () => { 
        it("test users can buy token and balance is gotten", async () => {
            const {contractDeployed} = await loadFixture(deployMoviewContract);
            const [user1] = await hre.ethers.getSigners();
            await contractDeployed.connect(user1).buyToken(200);
            expect(await contractDeployed.balanceOf(user1.address)).to.equal(200);
        });

        it("tests that user can buy and transfer", async () => {
            const {contractDeployed, acc1,acc2, acc3} = await loadFixture(deployMoviewContract);
            await contractDeployed.connect(acc1).buyToken(200);
            expect(await contractDeployed.balanceOf(acc1)).to.equal(200);
            await contractDeployed.connect(acc1).buyToken(200);
            expect(await contractDeployed.balanceOf(acc1)).to.equal(400);
            await contractDeployed.connect(acc1).transfer(acc2, 60);
            expect(await contractDeployed.balanceOf(acc1)).to.equal(340);
            expect(await contractDeployed.balanceOf(acc2)).to.equal(60);
            await contractDeployed.connect(acc3).transfer(acc1, 300);
            expect(await contractDeployed.balanceOf(acc3)).to.equal(0);
            expect(await contractDeployed.balanceOf(acc1)).to.equal(340);
        })
    })

    describe("transferFrom test scenarios", () => { 
        it("test token approval", async () => { 
            const { contractDeployed, acc1, acc2, acc3 } = await loadFixture(deployMoviewContract);
            expect(await contractDeployed.balanceOf(acc3)).to.equal(0);
            await contractDeployed.approve(acc3.address, 200);
        })
    })
    
    describe("approve", function () {
        it("should not change token balance when approving", async () => {
            const { contractDeployed, acc1, acc2 } = await loadFixture(deployMoviewContract);
            const beforeBalance = await contractDeployed.balanceOf(acc1.address);
            await contractDeployed.connect(acc1).approve(acc2.address, 200);
            const afterBalance = await contractDeployed.balanceOf(acc1.address);
            expect(afterBalance).to.equal(beforeBalance);
        }); 
    });

  describe("allowance", function () {


    it("should return 0 when no approval was made", async () => {
      const { contractDeployed, acc1, acc2 } = await loadFixture(deployMoviewContract);
      const allowance = await contractDeployed.allowance(acc1.address, acc2.address);
      expect(allowance).to.equal(0);
    });
   
  });
 
})