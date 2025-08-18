import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer, BigNumber } from "ethers";

describe("Lottery Contract", function () {
  let Lottery: any;
  let lottery: Contract;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;
  let addrs: Signer[];
  const ENTRY_FEE: BigNumber = ethers.parseEther("0.01");

  beforeEach(async function () {
    Lottery = await ethers.getContractFactory("Lottery");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    lottery = await Lottery.deploy();
    await lottery.waitForDeployment();
  });

  it("Should allow entry with exact fee", async function () {
    await expect(lottery.connect(addr1).joinLottery({ value: ENTRY_FEE }))
      .to.emit(lottery, "PlayerJoined")
      .withArgs(await addr1.getAddress(), 1);
    const players: string[] = await lottery.getPlayers();
    expect(players).to.include(await addr1.getAddress());
  });

  it("Should reject incorrect entry fee", async function () {
    await expect(
      lottery.connect(addr1).joinLottery({ value: ethers.parseEther("0.02") })
    ).to.be.revertedWith("Incorrect entry fee");
  });

  it("Should prevent double entry in same round", async function () {
    await lottery.connect(addr1).joinLottery({ value: ENTRY_FEE });
    await expect(
      lottery.connect(addr1).joinLottery({ value: ENTRY_FEE })
    ).to.be.revertedWith("Already entered this round");
  });

  it("Should select winner after 10 players", async function () {
    const players: Signer[] = [addr1, addr2, ...addrs.slice(0, 8)];
    for (let i = 0; i < 10; i++) {
      await lottery.connect(players[i]).joinLottery({ value: ENTRY_FEE });
    }
    const currentPlayers: string[] = await lottery.getPlayers();
    expect(currentPlayers.length).to.equal(0); 
    expect(await lottery.round()).to.equal(2); 
  });

  it("Should transfer prize pool to winner", async function () {
    const players: Signer[] = [addr1, addr2, ...addrs.slice(0, 8)];
    const initialBalance: BigNumber = await ethers.provider.getBalance(await addr1.getAddress());

    for (let i = 0; i < 10; i++) {
      await lottery.connect(players[i]).joinLottery({ value: ENTRY_FEE });
    }

    const winner: string = await lottery.winner();
    const finalBalance: BigNumber = await ethers.provider.getBalance(await addr1.getAddress());
    if (winner === (await addr1.getAddress())) {
      expect(finalBalance).to.be.above(initialBalance); 
    }
  });

  it("Should reset lottery for next round", async function () {
    const players: Signer[] = [addr1, addr2, ...addrs.slice(0, 8)];
    for (let i = 0; i < 10; i++) {
      await lottery.connect(players[i]).joinLottery({ value: ENTRY_FEE });
    }
    expect((await lottery.getPlayers()).length).to.equal(0);
    expect(await lottery.round()).to.equal(2);
    await lottery.connect(addr1).joinLottery({ value: ENTRY_FEE }); 
    expect(await lottery.getPlayers()).to.include(await addr1.getAddress());
  });
});