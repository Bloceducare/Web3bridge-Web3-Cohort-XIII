import { expect } from "chai";
import hre from "hardhat";

describe("Storage", function () {
  // We define a fixture to reuse the same setup in every test.
  async function deployStorageFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const Storage = await hre.ethers.getContractFactory("Storage");
    const storage = await Storage.deploy();

    return { storage, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const { storage } = await deployStorageFixture();
      expect(storage.target).to.not.equal(undefined);
    });

    it("Should initialize with number = 0", async function () {
      const { storage } = await deployStorageFixture();
      expect(await storage.retrieve()).to.equal(0);
    });
  });

  describe("Store Function", function () {
    it("Should store a number correctly", async function () {
      const { storage } = await deployStorageFixture();
      const testNumber = 42;
      
      await storage.store(testNumber);
      expect(await storage.retrieve()).to.equal(testNumber);
    });

    it("Should store zero correctly", async function () {
      const { storage } = await deployStorageFixture();
      
      await storage.store(0);
      expect(await storage.retrieve()).to.equal(0);
    });

    it("Should store a large number correctly", async function () {
      const { storage } = await deployStorageFixture();
      const largeNumber = 2n ** 256n - 1n; // Maximum uint256
      
      await storage.store(largeNumber);
      expect(await storage.retrieve()).to.equal(largeNumber);
    });

    it("Should allow anyone to call store function", async function () {
      const { storage, otherAccount } = await deployStorageFixture();
      const testNumber = 100;
      
      await storage.connect(otherAccount).store(testNumber);
      expect(await storage.retrieve()).to.equal(testNumber);
    });
  });

  describe("Retrieve Function", function () {
    it("Should return the stored number", async function () {
      const { storage } = await deployStorageFixture();
      const testNumber = 123;
      
      await storage.store(testNumber);
      expect(await storage.retrieve()).to.equal(testNumber);
    });

    it("Should return 0 when no number has been stored", async function () {
      const { storage } = await deployStorageFixture();
      expect(await storage.retrieve()).to.equal(0);
    });

    it("Should return updated number after multiple stores", async function () {
      const { storage } = await deployStorageFixture();
      
      await storage.store(10);
      expect(await storage.retrieve()).to.equal(10);
      
      await storage.store(20);
      expect(await storage.retrieve()).to.equal(20);
      
      await storage.store(30);
      expect(await storage.retrieve()).to.equal(30);
    });
  });

  describe("Integration Tests", function () {
    it("Should maintain state across multiple transactions", async function () {
      const { storage, owner, otherAccount } = await deployStorageFixture();
      
      // Owner stores a number
      await storage.connect(owner).store(50);
      expect(await storage.retrieve()).to.equal(50);
      
      // Other account stores a different number
      await storage.connect(otherAccount).store(75);
      expect(await storage.retrieve()).to.equal(75);
      
      // Owner stores another number
      await storage.connect(owner).store(25);
      expect(await storage.retrieve()).to.equal(25);
    });

    it("Should handle view function calls without gas cost", async function () {
      const { storage } = await deployStorageFixture();
      
      // Store a number first
      await storage.store(999);
      
      // Retrieve should be a view function (no gas cost for caller)
      const result = await storage.retrieve();
      expect(result).to.equal(999);
    });
  });
});
