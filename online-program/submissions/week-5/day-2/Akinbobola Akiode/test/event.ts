import { expect } from "chai";
import { ethers } from "hardhat";
import { EventContract } from "../typechain-types";

describe("EventContract", function () {
  let eventContract: EventContract;
  let owner: any;
  let organizer: any;
  let buyer: any;

  const baseURI = "ipfs://QmTestURI/";

  beforeEach(async function () {
    [owner, organizer, buyer] = await ethers.getSigners();

    const EventContract = await ethers.getContractFactory("EventContract");
    eventContract = await EventContract.deploy(baseURI);
    await eventContract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should start with 0 events and tickets", async function () {
      expect(await eventContract.eventCount()).to.equal(0);
      expect(await eventContract.ticketCount()).to.equal(0);
    });
  });

  describe("Event Creation", function () {
    it("Should create a paid event", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const futureTime = currentTime + 86400;

      const tx = await eventContract.connect(organizer).createEvent(
        "Test Conference",
        "A test conference",
        futureTime,
        futureTime + 86400,
        ethers.parseEther("0.1"),
        "ipfs://test-banner",
        1,
        50
      );
      await tx.wait();

      expect(await eventContract.eventCount()).to.equal(1);
      
      const event = await eventContract.events(1);
      expect(event.title).to.equal("Test Conference");
      expect(event.organizer).to.equal(organizer.address);
    });

    it("Should create a free event", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const futureTime = currentTime + 86400;

      const tx = await eventContract.connect(organizer).createEvent(
        "Free Workshop",
        "A free workshop",
        futureTime,
        futureTime + 86400,
        ethers.parseEther("0"),
        "ipfs://free-banner",
        0,
        25
      );
      await tx.wait();

      expect(await eventContract.eventCount()).to.equal(1);
      
      const event = await eventContract.events(1);
      expect(event.title).to.equal("Free Workshop");
      expect(event.eventType).to.equal(0);
    });
  });

  describe("Ticket Purchase", function () {
    beforeEach(async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const futureTime = currentTime + 86400;

      const tx = await eventContract.connect(organizer).createEvent(
        "Test Conference",
        "A test conference",
        futureTime,
        futureTime + 86400,
        ethers.parseEther("0.1"),
        "ipfs://test-banner",
        1,
        50
      );
      await tx.wait();
    });

    it("Should buy a paid ticket", async function () {
      const tx = await eventContract.connect(buyer).buyTicket(1, {
        value: ethers.parseEther("0.1")
      });
      await tx.wait();

      expect(await eventContract.ticketCount()).to.equal(1);
      
      const ticket = await eventContract.tickets(1);
      expect(ticket.owner).to.equal(buyer.address);
      expect(ticket.eventId).to.equal(1);
    });

    it("Should fail with insufficient payment", async function () {
      let error;
      try {
        const tx = await eventContract.connect(buyer).buyTicket(1, {
          value: ethers.parseEther("0.05")
        });
        await tx.wait();
      } catch (e: any) {
        error = e;
      }
      expect(error).to.not.be.undefined;
      expect(error.message).to.include("Insufficient payment");
    });
  });

  describe("Free Event Tickets", function () {
    beforeEach(async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const futureTime = currentTime + 86400;

      const tx = await eventContract.connect(organizer).createEvent(
        "Free Workshop",
        "A free workshop",
        futureTime,
        futureTime + 86400,
        ethers.parseEther("0"),
        "ipfs://free-banner",
        0,
        25
      );
      await tx.wait();
    });

    it("Should buy a free ticket", async function () {
      const tx = await eventContract.connect(buyer).buyTicket(1);
      await tx.wait();

      expect(await eventContract.ticketCount()).to.equal(1);
      
      const ticket = await eventContract.tickets(1);
      expect(ticket.owner).to.equal(buyer.address);
      expect(ticket.eventId).to.equal(1);
    });
  });
});