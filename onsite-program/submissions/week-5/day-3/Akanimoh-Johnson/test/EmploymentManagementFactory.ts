import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { EmployeeManagementFactory, EmployeeManagementFactory__factory, EmployeeManagement, EmployeeManagement__factory } from "../typechain-types";

describe("EmployeeManagementFactory Contract", function () {
  let EmployeeManagementFactory: EmployeeManagementFactory__factory;
  let factory: EmployeeManagementFactory;
  let owner: SignerWithAddress;
  let employee: SignerWithAddress;
  const name = "John Doe";
  const role = 0; // DEVELOPER
  const salaryInEther = 1;
  const salaryInWei = ethers.parseEther("1");

  beforeEach(async function () {
    [owner, employee] = await ethers.getSigners();
    EmployeeManagementFactory = await ethers.getContractFactory("EmployeeManagementFactory");
    factory = await EmployeeManagementFactory.deploy();
    await factory.waitForDeployment();
  });

  it("should deploy a new EmployeeManagement contract", async function () {
    const tx = await factory.deployEmployeeManagement();
    const receipt = await tx.wait();
    const event = receipt?.logs.find(log => log.fragment?.name === "EmployeeManagementDeployed");
    const contractAddress = event?.args[0];

    const empContract = EmployeeManagement__factory.connect(contractAddress, owner);
    await empContract.addEmployee(employee.address, name, role, salaryInEther);
    const emp = await empContract.getEmployeeDetails(employee.address);
    expect(emp.name).to.equal(name);
    expect(emp.salary).to.equal(salaryInWei);

    await expect(tx)
      .to.emit(factory, "EmployeeManagementDeployed")
      .withArgs(contractAddress);
  });
});