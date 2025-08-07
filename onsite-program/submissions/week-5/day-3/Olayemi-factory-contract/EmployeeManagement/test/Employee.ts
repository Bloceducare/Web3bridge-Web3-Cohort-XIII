import { expect } from "chai";
import { ethers } from "hardhat";
import { EmployeeManager } from "../typechain-types";

describe("EmployeeManager Contract", function () {
  let employeeManager: EmployeeManager;
  let owner: any, user1: any, user2: any, outsider: any;

  beforeEach(async () => {
    [owner, user1, user2, outsider] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("EmployeeManager");
    employeeManager = (await Factory.deploy()) as EmployeeManager;
    await employeeManager.waitForDeployment();

    await employeeManager.connect(owner).setOwner(owner.address);
  });

  it("should not allow owner to be set twice", async () => {
    await expect(employeeManager.connect(owner).setOwner(user1.address))
      .to.be.revertedWithCustomError(employeeManager, "Unauthorized");
  });

  it("should register a user correctly", async () => {
    await employeeManager.connect(owner).registerUser(user1.address, "Alice", ethers.parseEther("1000"), 0); // Mentor

    const details = await employeeManager.getUserDetails(user1.address);
    expect(details[0]).to.equal("Alice");
    expect(details[1]).to.equal(ethers.parseEther("1000"));
    expect(details[2]).to.equal("mentor");
    expect(details[3]).to.equal(true);
  });

  it("should reject invalid role", async () => {
    await expect(
      employeeManager.connect(owner).registerUser(user1.address, "Bob", ethers.parseEther("1000"), 5)
    ).to.be.revertedWithCustomError(employeeManager, "InvalidRole").withArgs(5);
  });

  it("should reject duplicate registration", async () => {
    await employeeManager.connect(owner).registerUser(user1.address, "Alice", ethers.parseEther("1000"), 1); // Admin
    await expect(
      employeeManager.connect(owner).registerUser(user1.address, "Alice", ethers.parseEther("1000"), 1)
    ).to.be.revertedWithCustomError(employeeManager, "AlreadyRegistered").withArgs(user1.address);
  });

  it("should disburse salary within limit", async () => {
    await employeeManager.connect(owner).registerUser(user1.address, "Alice", ethers.parseEther("1000"), 0);
    await owner.sendTransaction({ to: employeeManager.getAddress(), value: ethers.parseEther("2000") });

    const balanceBefore = await ethers.provider.getBalance(user1.address);
    await employeeManager.connect(owner).disburseSalary(user1.address, ethers.parseEther("500"));
    const balanceAfter = await ethers.provider.getBalance(user1.address);

    expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("500"));
  });

  it("should reject salary disbursement above limit", async () => {
    await employeeManager.connect(owner).registerUser(user1.address, "Alice", ethers.parseEther("1000"), 0);
    await expect(
      employeeManager.connect(owner).disburseSalary(user1.address, ethers.parseEther("1500"))
    ).to.be.revertedWithCustomError(employeeManager, "SalaryExceeded")
     .withArgs(ethers.parseEther("1500"), ethers.parseEther("1000"));
  });

  it("should reject salary disbursement to non-employee", async () => {
    await expect(
      employeeManager.connect(owner).disburseSalary(user2.address, ethers.parseEther("100"))
    ).to.be.revertedWithCustomError(employeeManager, "NotEmployed").withArgs(user2.address);
  });

  it("should return all registered users", async () => {
    await employeeManager.connect(owner).registerUser(user1.address, "Alice", ethers.parseEther("1000"), 1);
    await employeeManager.connect(owner).registerUser(user2.address, "Bob", ethers.parseEther("800"), 2);

    const users = await employeeManager.getAllUsers();
    expect(users).to.include.members([user1.address, user2.address]);
  });

  it("should enforce onlyOwner modifier", async () => {
    await expect(
      employeeManager.connect(outsider).registerUser(user1.address, "Alice", ethers.parseEther("1000"), 0)
    ).to.be.revertedWithCustomError(employeeManager, "Unauthorized");
  });
});