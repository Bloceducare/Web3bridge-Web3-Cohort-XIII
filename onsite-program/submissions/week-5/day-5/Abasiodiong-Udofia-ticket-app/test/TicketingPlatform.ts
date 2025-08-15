import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { Errors } from "../utils/errors";

describe("TicketingPlatform", function () {
  // Fixture to deploy the TicketingPlatform and setup accounts
  async function deployTicketingPlatformFixture() {
    const [owner, buyer, otherCreator] = await hre.ethers.getSigners();
    const TicketingPlatform = await hre.ethers.getContractFactory(
      "TicketingPlatform"
    );
    const platform = await TicketingPlatform.deploy();
    await platform.waitForDeployment();
    const ticketNFT = await hre.ethers.getContractAt(
      "TicketNFT",
      await platform.getTicketNFTAddress()
    );

    const ticketPrice = ethers.parseEther("0.1");

    return { platform, ticketNFT, ticketPrice, owner, buyer, otherCreator };
  }

  // Fixture to deploy and create an event
  async function createEventFixture() {
    const { platform, ticketNFT, owner, buyer, otherCreator } =
      await loadFixture(deployTicketingPlatformFixture);
    const ticketPrice = ethers.parseEther("0.1");
    const totalTickets = 100;
    await platform
      .connect(owner)
      .createEvent("Concert", ticketPrice, totalTickets);

    return {
      platform,
      ticketNFT,
      owner,
      buyer,
      otherCreator,
      ticketPrice,
      totalTickets,
    };
  }

  describe("Deployment", function () {
    it("Should deploy platform and NFT contract", async function () {
      const { platform, ticketNFT } = await loadFixture(
        deployTicketingPlatformFixture
      );
      expect(await platform.getTicketNFTAddress()).to.equal(
        ticketNFT.getAddress()
      );
      expect(await ticketNFT.name()).to.equal("TicketNFT");
      expect(await ticketNFT.symbol()).to.equal("TNFT");
    });
  });

  describe("Event Creation", function () {
    it("Should create an event", async function () {
      const { platform, owner } = await loadFixture(
        deployTicketingPlatformFixture
      );
      const ticketPrice = ethers.parseEther("0.1");
      await expect(
        platform.connect(owner).createEvent("Concert", ticketPrice, 100)
      )
        .to.emit(platform, "EventCreated")
        .withArgs(owner.address, 0, "Concert", ticketPrice, 100);
      const evt = await platform.getEvent(0);
      expect(evt.name).to.equal("Concert");
      expect(evt.ticketPrice).to.equal(ticketPrice);
      expect(evt.totalTickets).to.equal(100);
      expect(evt.ticketsSold).to.equal(0);
      expect(evt.status).to.equal(0); // ACTIVE
    });

    it("Should revert if event name is empty", async function () {
      const { platform, owner } = await loadFixture(
        deployTicketingPlatformFixture
      );
      await expect(
        platform.connect(owner).createEvent("", ethers.parseEther("0.1"), 100)
      ).to.be.revertedWithCustomError(platform, Errors.NameCannotBeEmpty);
    });

    it("Should revert if ticket price is zero", async function () {
      const { platform, owner } = await loadFixture(
        deployTicketingPlatformFixture
      );
      await expect(
        platform.connect(owner).createEvent("Concert", 0, 100)
      ).to.be.revertedWithCustomError(platform, Errors.InvalidTicketPrice);
    });

    it("Should revert if total tickets is zero", async function () {
      const { platform, owner } = await loadFixture(
        deployTicketingPlatformFixture
      );
      await expect(
        platform
          .connect(owner)
          .createEvent("Concert", ethers.parseEther("0.1"), 0)
      ).to.be.revertedWithCustomError(platform, Errors.InvalidTicketCount);
    });
  });

  describe("Ticket Purchasing", function () {
    it("Should purchase a ticket and mint an NFT", async function () {
      const { platform, ticketNFT, buyer, ticketPrice } = await loadFixture(
        createEventFixture
      );
      await expect(
        platform.connect(buyer).purchaseTicket(0, { value: ticketPrice })
      )
        .to.emit(platform, "TicketPurchased")
        .withArgs(buyer.address, 0, 0, 0);
      expect(await ticketNFT.ownerOf(0)).to.equal(buyer.address);
      expect(await platform.getTicketTokenId(0, 0)).to.equal(0);
      const evt = await platform.getEvent(0);
      expect(evt.ticketsSold).to.equal(1);
    });

    it("Should return correct token URI", async function () {
      const { platform, ticketNFT, buyer, ticketPrice } = await loadFixture(
        createEventFixture
      );
      await platform.connect(buyer).purchaseTicket(0, { value: ticketPrice });
      const tokenURI = await ticketNFT.tokenURI(0);
      expect(tokenURI).to.equal("https://ticketing-platform.com/ticket/0");
      await expect(ticketNFT.tokenURI(999)).to.be.revertedWith(
        "ERC721: URI query for nonexistent token"
      );
    });

    // it("Should refund excess payment", async function () {
    //   const { platform, buyer, ticketPrice } = await loadFixture(
    //     createEventFixture
    //   );
    //   const payment = ethers.parseEther("0.2");
    //   const initialBalance = await hre.ethers.provider.getBalance(
    //     buyer.address
    //   );
    //   const tx = await platform
    //     .connect(buyer)
    //     .purchaseTicket(0, { value: payment });
    //   const receipt = await tx.wait();
    //   const gasUsed = receipt?.gasUsed.mul(receipt.effectiveGasPrice);
    //   const finalBalance = await hre.ethers.provider.getBalance(buyer.address);
    //   expect(finalBalance).to.be.closeTo(
    //     initialBalance.sub(ticketPrice).sub(gasUsed),
    //     ethers.parseEther("0.01")
    //   );
    // });

    it("Should revert if event does not exist", async function () {
      const { platform, buyer } = await loadFixture(
        deployTicketingPlatformFixture
      );
      await expect(
        platform
          .connect(buyer)
          .purchaseTicket(0, { value: hre.ethers.parseEther("0.1") })
      ).to.be.revertedWithCustomError(platform, Errors.EventNotFound(0));
    });

    it("Should revert if payment is insufficient", async function () {
      const { platform, buyer, ticketPrice } = await loadFixture(
        createEventFixture
      );
      const amount = hre.ethers.parseEther("0.05");
      await expect(
        platform.connect(buyer).purchaseTicket(0, { value: amount })
      ).to.be.revertedWithCustomError(
        platform,
        Errors.InsufficientPayment(ticketPrice.toString(), buyer.toString())
      );
    });

    it("Should revert if no tickets are available", async function () {
      const { platform, buyer, ticketPrice, owner } = await loadFixture(
        deployTicketingPlatformFixture
      );
      await platform.connect(owner).createEvent("Concert", ticketPrice, 1);
      await platform.connect(buyer).purchaseTicket(0, { value: ticketPrice });
      await expect(
        platform.connect(buyer).purchaseTicket(0, { value: ticketPrice })
      ).to.be.revertedWithCustomError(platform, Errors.NoTicketsAvailable(0));
    });

    it("Should revert if event is closed", async function () {
      const { platform, buyer, owner, ticketPrice } = await loadFixture(
        createEventFixture
      );
      await platform.connect(owner).closeEvent(0);
      await expect(
        platform.connect(buyer).purchaseTicket(0, { value: ticketPrice })
      ).to.be.revertedWithCustomError(platform, Errors.EventNotActive(0));
    });
  });

  describe("Event Closing", function () {
    it("Should close an event", async function () {
      const { platform, owner } = await loadFixture(createEventFixture);
      await expect(platform.connect(owner).closeEvent(0))
        .to.emit(platform, "EventClosed")
        .withArgs(owner.address, 0);
      const evt = await platform.getEvent(0);
      expect(evt.status).to.equal(1); // CLOSED
    });

    it("Should revert if not event creator", async function () {
      const { platform, buyer } = await loadFixture(createEventFixture);
      await expect(
        platform.connect(buyer).closeEvent(0)
      ).to.be.revertedWithCustomError(platform, Errors.NotEventCreator(0));
    });

    it("Should revert if event does not exist", async function () {
      const { platform, owner } = await loadFixture(
        deployTicketingPlatformFixture
      );
      await expect(
        platform.connect(owner).closeEvent(0)
      ).to.be.revertedWithCustomError(platform, Errors.EventNotFound(0));
    });
  });

  describe("Event Queries", function () {
    it("Should get events by creator", async function () {
      const { platform, owner } = await loadFixture(
        deployTicketingPlatformFixture
      );
      await platform
        .connect(owner)
        .createEvent("Concert 1", ethers.parseEther("0.1"), 100);
      await platform
        .connect(owner)
        .createEvent("Concert 2", ethers.parseEther("0.2"), 50);
      const events = await platform.getEventsByCreator(owner.address);
      expect(events.length).to.equal(2);
      expect(events).to.include(0);
      expect(events).to.include(1);
    });

    it("Should return empty array for non-creator", async function () {
      const { platform, buyer } = await loadFixture(createEventFixture);
      const events = await platform.getEventsByCreator(buyer.address);
      expect(events.length).to.equal(0);
    });
  });
});
