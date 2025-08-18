import { expect } from "chai";
import { ethers } from "hardhat";


describe("Lottery Contract", function () {

  it("Users can enter with exact fee", async function () {
    const [owner, player] = await ethers.getSigners();
    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy();
  

   await expect(
  (lottery.connect(player) as any).enter({ value: ethers.parseEther("0.01") })
).to.emit(lottery, "PlayerJoined").withArgs(player.address);

  });

  it("Users cannot enter with wrong fee", async function () {
    const [owner, player] = await ethers.getSigners();
    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy();
    

   await expect(
  (lottery.connect(player) as any).enter({ value: ethers.parseEther("0.02") })
).to.be.revertedWith("Send exactly 0.01 ETH");

  });

  it("Users cannot enter twice in the same round", async function () {
    const [owner, player] = await ethers.getSigners();
    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy();
    

    await (lottery.connect(player) as any).enter({ value: ethers.parseEther("0.01") });


  await expect(
  (lottery.connect(player) as any).enter({ value: ethers.parseEther("0.01") })
).to.be.revertedWith("You already joined");

  });

  it("Winner is picked only after 10 players", async function () {
    const [owner, ...accounts] = await ethers.getSigners();
    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy();
    

    for (let i = 0; i < 10; i++) {
      await (lottery.connect(accounts[i]) as any).enter({ value: ethers.parseEther("0.01") });

    }

    const players: string[] = await lottery.getPlayers();
    expect(players.length).to.equal(0); 
  });

  it("Prize pool is transferred to winner", async function () {
    const [owner, ...accounts] = await ethers.getSigners();
    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy();



   const startingBalances: any[] = [];


    for (let i = 0; i < 10; i++) {
      startingBalances[i] = await ethers.provider.getBalance(accounts[i].address);
     await (lottery.connect(accounts[i]) as any).enter({ value: ethers.parseEther("0.01") });

    }


   const finalBalances: any[] = await Promise.all(
  accounts.map(a => ethers.provider.getBalance(a.address))
);

    const winnerBalance = finalBalances.find((b, i) => b > startingBalances[i]);

    expect(winnerBalance).to.not.be.undefined;
  });

});
