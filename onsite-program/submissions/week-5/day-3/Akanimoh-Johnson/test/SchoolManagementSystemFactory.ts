import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { SchoolManagementSystemFactory, SchoolManagementSystemFactory__factory, SchoolManagementSystem, SchoolManagementSystem__factory } from "../typechain-types";

describe("SchoolManagementSystemFactory Contract", function () {
  let SchoolManagementSystemFactory: SchoolManagementSystemFactory__factory;
  let factory: SchoolManagementSystemFactory;
  let owner: SignerWithAddress;
  const name = "Alice";
  const age = 20;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    SchoolManagementSystemFactory = await ethers.getContractFactory("SchoolManagementSystemFactory");
    factory = await SchoolManagementSystemFactory.deploy();
    await factory.waitForDeployment();
  });

  it("should deploy a new SchoolManagementSystem contract", async function () {
    const tx = await factory.deploySchoolManagementSystem();
    const receipt = await tx.wait();
    const event = receipt?.logs.find(log => log.fragment?.name === "SchoolManagementSystemDeployed");
    const contractAddress = event?.args[0];

    const school = SchoolManagementSystem__factory.connect(contractAddress, owner);
    await school.register_student(name, age);
    const student = await school.get_student(0);
    expect(student.name).to.equal(name);
    expect(student.age).to.equal(age);

    await expect(tx)
      .to.emit(factory, "SchoolManagementSystemDeployed")
      .withArgs(contractAddress);
  });
});