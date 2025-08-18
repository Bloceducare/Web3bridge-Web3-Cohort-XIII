import { expect } from "chai";
import hre from "hardhat";

describe("Lottery", function () {
  let lottery: any;
  let owner: any;
  let addr1: any, addr2: any, addr3: any, addr4: any, addr5: any, addr6: any, addr7: any, addr8: any, addr9: any, addr10: any;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9, addr10] = await hre.ethers.getSigners();
    
    const Lottery = await hre.ethers.getContractFactory("Lottery");
    lottery = await Lottery.deploy();
  });

  it("Should set the right entry fee", async function () {
    expect(await lottery.entryFee()).to.equal(hre.ethers.parseEther("0.01"));
  });

  it("Should allow player to enter with correct fee", async function () {
    await lottery.connect(addr1).enter({ value: hre.ethers.parseEther("0.01") });
    expect(await lottery.getPlayerCount()).to.equal(1);
  });

  it("Should reject wrong entry fee", async function () {
    await expect(
      lottery.connect(addr1).enter({ value: hre.ethers.parseEther("0.005") })
    ).to.be.revertedWith("Wrong entry fee");
  });

  it("Should track players correctly", async function () {
    const addresses = [addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9];
    
    for(let i = 0; i < addresses.length; i++) {
      await lottery.connect(addresses[i]).enter({ value: hre.ethers.parseEther("0.01") });
    }
    
    expect(await lottery.getPlayerCount()).to.equal(9);
  });

  it("Should select winner after 10 players", async function () {
    const addresses = [addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9, addr10];
    
    for(let i = 0; i < addresses.length; i++) {
      await lottery.connect(addresses[i]).enter({ value: hre.ethers.parseEther("0.01") });
    }
    
    expect(await lottery.getPlayerCount()).to.equal(0);
  });

  it("Should prevent double entry", async function () {
    await lottery.connect(addr1).enter({ value: hre.ethers.parseEther("0.01") });
    
    await expect(
      lottery.connect(addr1).enter({ value: hre.ethers.parseEther("0.01") })
    ).to.be.revertedWith("Already entered");
  });

 
    })
    
    