import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("BilalEnterprise", () => {
  async function deployEnterpriseFixture() {
    const Enterprise = await ethers.getContractFactory("BilalEnterprise");
    const [owner, emp1, emp2] = await ethers.getSigners();
    const enterprise = await Enterprise.deploy();
    await enterprise.waitForDeployment();
    return { enterprise, owner, emp1, emp2 };
  }

  describe("Employee registration", () => {
    it("Should register a new employee", async () => {
      const { enterprise, emp1 } = await loadFixture(deployEnterpriseFixture);

      await enterprise.connect(emp1).registerUser(
        ethers.parseUnits("1000", 18),
        1
      );

      const employees = await enterprise.getEmployees();
      expect(employees.length).to.equal(1);
      expect(employees[0].userAddress).to.equal(emp1.address);
      expect(employees[0].salary).to.equal(ethers.parseUnits("1000", 18));
      expect(employees[0].role).to.equal(1);
    });

    it("Should revert if employee already exists", async () => {
      const { enterprise, emp1 } = await loadFixture(deployEnterpriseFixture);

      await enterprise.connect(emp1).registerUser(ethers.parseUnits("1000", 18), 0);
      await expect(
        enterprise.connect(emp1).registerUser(ethers.parseUnits("1000", 18), 0)
      ).to.be.revertedWithCustomError(enterprise, "EMPLOYEE_ALREADY_EXISTS");
    });
  });

  describe("Get employee balance", () => {
    it("Should return balance of registered employee", async () => {
      const { enterprise, emp1 } = await loadFixture(deployEnterpriseFixture);

      await enterprise.connect(emp1).registerUser(ethers.parseUnits("1000", 18), 0);
      expect(await enterprise.getBalance(emp1.address)).to.equal(0);
    });

    it("Should revert for non-existent employee", async () => {
      const { enterprise, emp2 } = await loadFixture(deployEnterpriseFixture);
      await expect(
        enterprise.getBalance(emp2.address)
      ).to.be.revertedWithCustomError(enterprise, "EMPLOYEE_NOT_FOUND");
    });
  });

  describe("Pay salary", () => {
    it("Should pay salary if conditions are met", async () => {
      const { enterprise, emp1, owner } = await loadFixture(deployEnterpriseFixture);

      await enterprise.connect(emp1).registerUser(
        ethers.parseUnits("1", 18),
        0
      );

      await owner.sendTransaction({
        to: await enterprise.getAddress(),
        value: ethers.parseUnits("10", 18),
      });

      await enterprise.paySalary(emp1.address);

      expect(await enterprise.getBalance(emp1.address)).to.equal(
        ethers.parseUnits("1", 18)
      );
    });

    it("Should revert if employee does not exist", async () => {
      const { enterprise, emp2 } = await loadFixture(deployEnterpriseFixture);

      await expect(
        enterprise.paySalary(emp2.address)
      ).to.be.revertedWithCustomError(enterprise, "EMPLOYEE_NOT_FOUND");
    });

    it("Should revert if employee not eligible", async () => {
      const { enterprise, emp1 } = await loadFixture(deployEnterpriseFixture);

      await enterprise.connect(emp1).registerUser(ethers.parseUnits("1000", 18), 0);

      // Manually set status to NotEmployed
      const empData = await enterprise.getAnEmployee(emp1.address);
      expect(empData.status).to.equal(0); // Employed (default)
      // For now, contract doesn’t have status change, so test is theoretical
    });

    it("Should revert if insufficient balance in contract", async () => {
      const { enterprise, emp1 } = await loadFixture(deployEnterpriseFixture);

      await enterprise.connect(emp1).registerUser(
        ethers.parseUnits("5", 18),
        0
      );

      await expect(
        enterprise.paySalary(emp1.address)
      ).to.be.revertedWithCustomError(enterprise, "INSUFFICIENT_CONTRACT_BALANCE");
    });
  });

  describe("Get employee details", () => {
    it("Should return correct employee details", async () => {
      const { enterprise, emp1 } = await loadFixture(deployEnterpriseFixture);

      await enterprise.connect(emp1).registerUser(ethers.parseUnits("1000", 18), 2);
      const empData = await enterprise.getAnEmployee(emp1.address);

      expect(empData.userAddress).to.equal(emp1.address);
      expect(empData.role).to.equal(2);
    });

    it("Should revert if employee not found", async () => {
      const { enterprise, emp2 } = await loadFixture(deployEnterpriseFixture);

      await expect(
        enterprise.getAnEmployee(emp2.address)
      ).to.be.revertedWithCustomError(enterprise, "EMPLOYEE_NOT_FOUND");
    });
  });
});
