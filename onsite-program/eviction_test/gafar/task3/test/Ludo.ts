import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe("Ludo Contract", function () {
  async function deployLudo() {
    const [owner, alice, bob, charlie, dave, eve] = await hre.ethers.getSigners();
    const Ludo = await ethers.getContractFactory("Ludo");
    const ludo = await Ludo.deploy();
    return { ludo, owner, alice, bob, charlie, dave, eve };
  }

  it("should allow creating up to 4 players", async function () {
    const { ludo, alice, bob, charlie, dave, eve } = await deployLudo();

    await ludo.connect(alice).createUser("Alice", 0, 0);
    await ludo.connect(bob).createUser("Bob", 0, 1);
    await ludo.connect(charlie).createUser("Charlie", 0, 2);
    await ludo.connect(dave).createUser("Dave", 0, 3);

    await expect(ludo.connect(eve).createUser("Eve", 0, 0)).to.be.revertedWithCustomError(
      ludo,
      "MaximumUserReached"
    );
  });

  it("should revert if name is empty", async function () {
    const { ludo, alice } = await deployLudo();
    await expect(ludo.connect(alice).createUser("", 0, 0)).to.be.revertedWithCustomError(
      ludo,
      "InvalidName"
    );
  });

  it("should revert if color already taken", async function () {
    const { ludo, alice, bob } = await deployLudo();
    await ludo.connect(alice).createUser("Alice", 0, 0); // RED
    await expect(ludo.connect(bob).createUser("Bob", 0, 0)).to.be.revertedWithCustomError(
      ludo,
      "ColorAlreadyTaken"
    );
  });

  it("should roll a dice between 1 and 6", async function () {
    const { ludo, alice } = await deployLudo();
    await ludo.connect(alice).createUser("Alice", 0, 0);

    const dice = await ludo.connect(alice).rollDice();
    expect(dice).to.be.gte(1).and.to.be.lte(6);
  });

  it("should move a player correctly after dice roll", async function () {
    const { ludo, alice } = await deployLudo();
    await ludo.connect(alice).createUser("Alice", 0, 0);

    await ludo.connect(alice).makeMove();
    const player = await ludo.getPlayer(alice.address);

    expect(player.position).to.be.greaterThan(0);
  });

  it("should return all players", async function () {
    const { ludo, alice, bob } = await deployLudo();
    await ludo.connect(alice).createUser("Alice", 0, 0);
    await ludo.connect(bob).createUser("Bob", 0, 1);

    const players = await ludo.getAllPlayers();
    expect(players.length).to.equal(2);
  });

  it("should return single player", async function () {
    const { ludo, alice } = await deployLudo();
    await ludo.connect(alice).createUser("Alice", 0, 0);
    const player = await ludo.getPlayer(alice.address);
    expect(player.name).to.equal("Alice");
  });

  it("should reset game and clear players", async function () {
    const { ludo, owner, alice } = await deployLudo();
    await ludo.connect(alice).createUser("Alice", 0, 0);
    expect((await ludo.getAllPlayers()).length).to.equal(1);

    await ludo.connect(owner).resetGame();
    expect((await ludo.getAllPlayers()).length).to.equal(0);
  });
});
