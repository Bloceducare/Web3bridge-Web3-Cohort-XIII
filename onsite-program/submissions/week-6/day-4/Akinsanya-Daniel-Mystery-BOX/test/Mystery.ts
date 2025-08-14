import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("MysteryBox", function () {
   async function deployMysteryBox() {
   const vrfCoordinator = "0xYourVRFCoordinatorAddress"; 
   const subscriptionId = 12345; 
   const keyHash = "0xYourKeyHash";  
   const boxFee = ethers.parseEther("0.01"); 

   const RewardToken = await ethers.getContractFactory("RewardToken");
   const rewardToken = await RewardToken.deploy(ethers.parseUnits("1000",18));

   const RewardNft = await ethers.getContractFactory("RewardNft");
   const rewardNft = await RewardNft.deploy();
   
   const MysteryBox = await ethers.getContractFactory("MysteryBox");
    const mysteryBox = await MysteryBox.deploy(vrfCoordinator,subscriptionId,keyHash,boxFee,rewardToken.getAddress(),rewardNft.getAddress());

    return { mysteryBox,rewardToken,rewardNft};
}

  it("should add reward successfully",async function(){
  const { mysteryBox, rewardToken, rewardNft } = await deployMysteryBox();
  const rewardType = 0;
  const tokenId = 1;
  const amount = ethers.parseUnits("10", 18);
  const tokenAddress = rewardToken.getAddress();
  const weight = 100;
  const tx = await mysteryBox.addReward(rewardType, tokenId, amount, tokenAddress, weight);
  const tx2 = await tx.wait();
  mysteryBox.getAllRewards();  


  })


})

  // it("Should deploy the MysteryBox contract", async function () {
  //   const MysteryBox = await ethers.getContractFactory("MysteryBox");
  //   const mysteryBox = await MysteryBox.deploy(vrfCoordinator);
  // })
// }
  // it("Should emit the Increment event when calling the inc() function", async function () {
  //   const counter = await ethers.deployContract("Counter");

  //   await expect(counter.inc()).to.emit(counter, "Increment").withArgs(1n);
  // });

  // it("The sum of the Increment events should match the current value", async function () {
  //   const counter = await ethers.deployContract("Counter");
  //   const deploymentBlockNumber = await ethers.provider.getBlockNumber();

  //   // run a series of increments
  //   for (let i = 1; i <= 10; i++) {
  //     await counter.incBy(i);
  //   }

  //   const events = await counter.queryFilter(
  //     counter.filters.Increment(),
  //     deploymentBlockNumber,
  //     "latest",
  //   );

  //   // check that the aggregated events match the current value
  //   let total = 0n;
  //   for (const event of events) {
  //     total += event.args.by;
  //   }

  //   expect(await counter.x()).to.equal(total);
  // });});

