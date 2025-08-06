import hre from "hardhat";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { EmployeeManagementSystem } from "../typechain-types";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("EmployeeManagementSystem", () => {
  let owner: HardhatEthersSigner;
  let otherAccount: HardhatEthersSigner;
  let otherAccount2: HardhatEthersSigner;
  let emsContract: EmployeeManagementSystem;

  async function deployEMSFixture() {
    const [owner, otherAccount, otherAccount2] = await hre.ethers.getSigners();
    const EMS = await hre.ethers.getContractFactory("EmployeeManagementSystem");
    const ems = await EMS.deploy();

    return { otherAccount, owner, ems, otherAccount2 };
  }

  beforeEach("preset", async () => {
    const fixture = await loadFixture(deployEMSFixture);
    owner = fixture.owner;
    otherAccount = fixture.otherAccount;
    otherAccount2 = fixture.otherAccount2;
    emsContract = fixture.ems;
  });

  describe("Testing Functions", () => {
    it("should register employee", async () => {
      const _name = "Zach";
      const _role = "Mentor";
      const _walletAddress = otherAccount;
      const _salary = hre.ethers.parseEther("20");

      await emsContract.addEmployee(_name, _role, _walletAddress, _salary);

      expect((await emsContract.getEmployee(_walletAddress)).name).to.equal(
        _name
      );
    });

    it("should update employee", async () => {
      const _name = "Zacheus";
      const _role = "CEO";
      const _walletAddress = otherAccount;
      const _salary = hre.ethers.parseEther("20");

      expect(
        emsContract
          .connect(otherAccount)
          .updateEmployee(_name, _role, _walletAddress, _salary)
      ).to.be.revertedWithCustomError(emsContract, "NOT_THE_OWNER");

      await emsContract.updateEmployee(_name, _role, _walletAddress, _salary);

      expect((await emsContract.getEmployee(_walletAddress)).name).to.equal(
        _name
      );
    });
  });

  describe("Payment", () => {
    it("pay only employees in database", async () => {
      expect(
        emsContract.paySalary(hre.ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(emsContract, "EMPLOYEE_NOT_FOUND");
    });

    it("only owner can pay", async () => {
      expect(
        emsContract.connect(otherAccount).paySalary(otherAccount2)
      ).to.be.revertedWithCustomError(emsContract, "NOT_THE_OWNER");
    });

    it("don't pay employees that are not active", async () => {
      const _name = "Zach";
      const _role = "Mentor";
      const _walletAddress = otherAccount;
      const _salary = hre.ethers.parseEther("20");

      await emsContract.addEmployee(_name, _role, _walletAddress, _salary);
      await emsContract.updateEmployeeStatus(otherAccount, 1);

      expect(
        (await emsContract.getEmployee(otherAccount)).employmentStatus
      ).to.equal(1);

      expect(emsContract.paySalary(otherAccount)).to.be.revertedWithCustomError(
        emsContract,
        "EMPLOYEE_IS_NOT_ACTIVE"
      );

      await emsContract.updateEmployeeStatus(otherAccount, 0);
      expect(emsContract.paySalary(otherAccount)).to.be.revertedWith(
        "Failed to send Ether"
      );
    });
  });
});
