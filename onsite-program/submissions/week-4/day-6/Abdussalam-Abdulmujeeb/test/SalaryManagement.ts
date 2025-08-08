// import {loadFixture} from "@nomicfoundation/hardhat-toolbox/network-helpers";
// import { expect } from "chai";
// //import {ether} from "hardhat"
// import hre from "hardhat";

// describe("Salary Management", function () {
//   // We define a fixture to reuse the same setup in every test.
//   // We use loadFixture to run this setup once, snapshot that state,
//   // and reset Hardhat Network to that snapshot in every test.
//   async function deploySalaryManagemntFixture() {

//     // Contracts are deployed using the first signer/account by default
//     const [owner, otherAccount] = await hre.ethers.getSigners();

//     const Salary = await hre.ethers.getContractFactory("SalaryManagement");
//     const salary = await Salary.deploy(owner.address);

//     return { owner, otherAccount };
//   }

//   describe("Deployment", function () {
//     it("Should set the right unlockTime", async function () {
//       const { lock, unlockTime } = await loadFixture(deploySalaryManagementFixture);

//       expect(await lock.unlockTime()).to.equal(unlockTime);
//     });

//     it("Should set the right owner", async function () {
//       const { lock, owner } = await loadFixture(deployOneYearLockFixture);

//       expect(await lock.owner()).to.equal(owner.address);
//     });

//     it("Should receive and store the funds to lock", async function () {
//       const { lock, lockedAmount } = await loadFixture(
//         deployOneYearLockFixture
//       );

//       expect(await hre.ethers.provider.getBalance(lock.target)).to.equal(
//         lockedAmount
//       );
//     });

//     it("Should fail if the unlockTime is not in the future", async function () {
//       // We don't use the fixture here because we want a different deployment
//       const latestTime = await time.latest();
//       const Lock = await hre.ethers.getContractFactory("Lock");
//       await expect(Lock.deploy(latestTime, { value: 1 })).to.be.revertedWith(
//         "Unlock time should be in the future"
//       );
//     });
//   });

//   describe("Withdrawals", function () {
//     describe("Validations", function () {
//       it("Should revert with the right error if called too soon", async function () {
//         const { lock } = await loadFixture(deployOneYearLockFixture);

//         await expect(lock.withdraw()).to.be.revertedWith(
//           "You can't withdraw yet"
//         );
//       });

//       it("Should revert with the right error if called from another account", async function () {
//         const { lock, unlockTime, otherAccount } = await loadFixture(
//           deployOneYearLockFixture
//         );

//         // We can increase the time in Hardhat Network
//         await time.increaseTo(unlockTime);

//         // We use lock.connect() to send a transaction from another account
//         await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
//           "You aren't the owner"
//         );
//       });

//       it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
//         const { lock, unlockTime } = await loadFixture(
//           deployOneYearLockFixture
//         );

//         // Transactions are sent using the first signer by default
//         await time.increaseTo(unlockTime);

//         await expect(lock.withdraw()).not.to.be.reverted;
//       });
//     });

//     describe("Events", function () {
//       it("Should emit an event on withdrawals", async function () {
//         const { lock, unlockTime, lockedAmount } = await loadFixture(
//           deployOneYearLockFixture
//         );

//         await time.increaseTo(unlockTime);

//         await expect(lock.withdraw())
//           .to.emit(lock, "Withdrawal")
//           .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
//       });
//     });

//     describe("Transfers", function () {
//       it("Should transfer the funds to the owner", async function () {
//         const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
//           deployOneYearLockFixture
//         );

//         await time.increaseTo(unlockTime);

//         await expect(lock.withdraw()).to.changeEtherBalances(
//           [owner, lock],
//           [lockedAmount, -lockedAmount]
//         );
//       });
//     });
//   });
// });






// import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
// import { expect } from "chai";
// import hre from "hardhat";

// async function deploySalaryManagementFixture() {
//     // Contracts are deployed using the first signer/account by default
//     const [owner, employee1, employee2, nonEmployee] = await hre.ethers.getSigners();

//     const SalaryManagement = await hre.ethers.getContractFactory("SalaryManagement");
//     const salaryContract = await SalaryManagement.deploy();

//     // REMOVE THIS LINE - Don't try to fund the contract directly
//     // await owner.sendTransaction({
//     //   to: salaryContract.target,
//     //   value: hre.ethers.parseEther("10.0") // 10 ETH
//     // });

//     return { salaryContract, owner, employee1, employee2, nonEmployee };
// }

// // Then modify tests that need ETH to work differently:
// it("Should successfully transfer when owner is eligible", async function () {
//   const { salaryContract, owner, employee1 } = await loadFixture(deploySalaryManagementFixture);

//   // Add owner as an employee first
//   await salaryContract.addEmployee(owner.address, "Owner Employee", 0, true);

//   const initialBalance = await hre.ethers.provider.getBalance(employee1.address);
//   const transferAmount = hre.ethers.parseEther("1.0");

//   // Send ETH along with the transfer call instead of pre-funding
//   const tx = await salaryContract.transfer(employee1.address, transferAmount, {
//     value: transferAmount // This funds the contract at the same time as calling transfer
//   });
  
//   const finalBalance = await hre.ethers.provider.getBalance(employee1.address);
//   expect(finalBalance).to.equal(initialBalance + transferAmount);
// });





import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("SalaryManagement", function () {
  // We define a fixture to reuse the same setup in every test.
  async function deploySalaryManagementFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, employee1, employee2, nonEmployee] = await hre.ethers.getSigners();

    const SalaryManagement = await hre.ethers.getContractFactory("SalaryManagement");
    const salaryContract = await SalaryManagement.deploy();

    // Don't try to send ETH to contract directly since it has no receive function
    // Instead, we'll fund it through the transfer function calls when needed

    return { salaryContract, owner, employee1, employee2, nonEmployee };
  }

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const { salaryContract, owner } = await loadFixture(deploySalaryManagementFixture);

      // Check that contract was deployed (has an address)
      expect(salaryContract.target).to.be.properAddress;
    });

    it("Should have empty employee data initially", async function () {
      const { salaryContract, employee1 } = await loadFixture(deploySalaryManagementFixture);

      const employee = await salaryContract.employees(employee1.address);
      expect(employee.name).to.equal("");
      expect(employee.role).to.equal(0);
      expect(employee.isActive).to.equal(false);
    });
  });

  describe("Adding Employees", function () {
    it("Should successfully add an employee with Admin role", async function () {
      const { salaryContract, employee1 } = await loadFixture(deploySalaryManagementFixture);

      await salaryContract.addEmployee(
        employee1.address,
        "John Doe",
        0, // Role.Admin
        true // isActive
      );

      const employee = await salaryContract.employees(employee1.address);
      expect(employee.name).to.equal("John Doe");
      expect(employee.role).to.equal(0); // Admin role
      expect(employee.isActive).to.equal(true);
    });

    it("Should successfully add an employee with Mentors role", async function () {
      const { salaryContract, employee1 } = await loadFixture(deploySalaryManagementFixture);

      await salaryContract.addEmployee(
        employee1.address,
        "Jane Smith",
        1, // Role.Mentors
        true
      );

      const employee = await salaryContract.employees(employee1.address);
      expect(employee.name).to.equal("Jane Smith");
      expect(employee.role).to.equal(1); // Mentors role
      expect(employee.isActive).to.equal(true);
    });

    it("Should successfully add an employee with Security role", async function () {
      const { salaryContract, employee1 } = await loadFixture(deploySalaryManagementFixture);

      await salaryContract.addEmployee(
        employee1.address,
        "Bob Wilson",
        2, // Role.Security
        false // isActive = false
      );

      const employee = await salaryContract.employees(employee1.address);
      expect(employee.name).to.equal("Bob Wilson");
      expect(employee.role).to.equal(2); // Security role
      expect(employee.isActive).to.equal(false);
    });

    it("Should add employee to allEmployees array", async function () {
      const { salaryContract, employee1 } = await loadFixture(deploySalaryManagementFixture);

      await salaryContract.addEmployee(
        employee1.address,
        "Alice Brown",
        0, // Role.Admin
        true
      );

      const employeeFromArray = await salaryContract.allEmployees(0);
      expect(employeeFromArray.name).to.equal("Alice Brown");
      expect(employeeFromArray.role).to.equal(0);
      expect(employeeFromArray.isActive).to.equal(true);
    });

    it("Should allow anyone to add employees (no access control)", async function () {
      const { salaryContract, employee1, employee2 } = await loadFixture(deploySalaryManagementFixture);

      // Non-owner can add employees since there's no access control
      await salaryContract.connect(employee1).addEmployee(
        employee2.address,
        "Added by Employee",
        1,
        true
      );

      const employee = await salaryContract.employees(employee2.address);
      expect(employee.name).to.equal("Added by Employee");
    });
  });

  describe("Salary Eligibility Check", function () {
    it("Should return true for active Admin employee", async function () {
      const { salaryContract, employee1 } = await loadFixture(deploySalaryManagementFixture);

      await salaryContract.addEmployee(employee1.address, "Admin User", 0, true);
      
      const canReceive = await salaryContract.can_receive_salary(employee1.address);
      expect(canReceive).to.equal(true);
    });

    it("Should return true for active Mentors employee", async function () {
      const { salaryContract, employee1 } = await loadFixture(deploySalaryManagementFixture);

      await salaryContract.addEmployee(employee1.address, "Mentor User", 1, true);
      
      const canReceive = await salaryContract.can_receive_salary(employee1.address);
      expect(canReceive).to.equal(true);
    });

    it("Should return true for active Security employee", async function () {
      const { salaryContract, employee1 } = await loadFixture(deploySalaryManagementFixture);

      await salaryContract.addEmployee(employee1.address, "Security User", 2, true);
      
      const canReceive = await salaryContract.can_receive_salary(employee1.address);
      expect(canReceive).to.equal(true);
    });

    it("Should return true for inactive Admin (role overrides active status)", async function () {
      const { salaryContract, employee1 } = await loadFixture(deploySalaryManagementFixture);

      await salaryContract.addEmployee(employee1.address, "Inactive Admin", 0, false);
      
      const canReceive = await salaryContract.can_receive_salary(employee1.address);
      expect(canReceive).to.equal(true);
    });

    it("Should return true for inactive Mentors (role overrides active status)", async function () {
      const { salaryContract, employee1 } = await loadFixture(deploySalaryManagementFixture);

      await salaryContract.addEmployee(employee1.address, "Inactive Mentor", 1, false);
      
      const canReceive = await salaryContract.can_receive_salary(employee1.address);
      expect(canReceive).to.equal(true);
    });

    it("Should return true for inactive Security (role overrides active status)", async function () {
      const { salaryContract, employee1 } = await loadFixture(deploySalaryManagementFixture);

      await salaryContract.addEmployee(employee1.address, "Inactive Security", 2, false);
      
      const canReceive = await salaryContract.can_receive_salary(employee1.address);
      expect(canReceive).to.equal(true);
    });

    it("Should return false for non-existent employee", async function () {
      const { salaryContract, nonEmployee } = await loadFixture(deploySalaryManagementFixture);
      
      const canReceive = await salaryContract.can_receive_salary(nonEmployee.address);
      expect(canReceive).to.equal(false);
    });
  });

  describe("Salary Transfer", function () {
    it("Should fail when non-owner tries to transfer", async function () {
      const { salaryContract, employee1, employee2 } = await loadFixture(deploySalaryManagementFixture);

      await salaryContract.addEmployee(employee1.address, "Employee", 0, true);

      await expect(
        salaryContract.connect(employee1).transfer(employee2.address, hre.ethers.parseEther("1.0"), {
          value: hre.ethers.parseEther("1.0")
        })
      ).to.be.revertedWithCustomError(salaryContract, "YOURE_A_THIEF");
    });

    it("Should fail when owner tries to transfer but is not eligible", async function () {
      const { salaryContract, owner, employee1 } = await loadFixture(deploySalaryManagementFixture);

      // Owner is not added as an employee, so not eligible
      await expect(
        salaryContract.transfer(employee1.address, hre.ethers.parseEther("1.0"), {
          value: hre.ethers.parseEther("1.0")
        })
      ).to.be.revertedWith("You are not eligible to receive salary");
    });

    it("Should successfully transfer when owner is eligible", async function () {
      const { salaryContract, owner, employee1 } = await loadFixture(deploySalaryManagementFixture);

      // Add owner as an employee first
      await salaryContract.addEmployee(owner.address, "Owner Employee", 0, true);

      const initialBalance = await hre.ethers.provider.getBalance(employee1.address);
      const transferAmount = hre.ethers.parseEther("1.0");

      // Send ETH with the transaction to fund the contract
      const tx = await salaryContract.transfer(employee1.address, transferAmount, {
        value: transferAmount
      });
      
      const finalBalance = await hre.ethers.provider.getBalance(employee1.address);
      expect(finalBalance).to.equal(initialBalance + transferAmount);
    });

    it("Should return correct address and amount", async function () {
      const { salaryContract, owner, employee1 } = await loadFixture(deploySalaryManagementFixture);

      await salaryContract.addEmployee(owner.address, "Owner Employee", 0, true);
      
      const transferAmount = hre.ethers.parseEther("0.5");
      
      // For testing return values, use staticCall
      const result = await salaryContract.transfer.staticCall(
        employee1.address, 
        transferAmount
      );
      
      expect(result[0]).to.equal(employee1.address); // returned address
      expect(result[1]).to.equal(transferAmount); // returned amount
    });

    it("Should fail if trying to transfer more than sent", async function () {
      const { salaryContract, owner, employee1 } = await loadFixture(deploySalaryManagementFixture);

      await salaryContract.addEmployee(owner.address, "Owner Employee", 0, true);
      
      // Try to transfer 2 ETH but only send 1 ETH
      await expect(
        salaryContract.transfer(employee1.address, hre.ethers.parseEther("2.0"), {
          value: hre.ethers.parseEther("1.0")
        })
      ).to.be.reverted; // Will fail due to insufficient funds
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple employees correctly", async function () {
      const { salaryContract, employee1, employee2 } = await loadFixture(deploySalaryManagementFixture);

      await salaryContract.addEmployee(employee1.address, "Employee 1", 0, true);
      await salaryContract.addEmployee(employee2.address, "Employee 2", 1, false);

      expect(await salaryContract.can_receive_salary(employee1.address)).to.equal(true);
      expect(await salaryContract.can_receive_salary(employee2.address)).to.equal(true); // Mentors role overrides inactive status
    });

    it("Should overwrite employee data when adding same address twice", async function () {
      const { salaryContract, employee1 } = await loadFixture(deploySalaryManagementFixture);

      await salaryContract.addEmployee(employee1.address, "First Name", 0, true);
      await salaryContract.addEmployee(employee1.address, "Second Name", 1, false);

      const employee = await salaryContract.employees(employee1.address);
      expect(employee.name).to.equal("Second Name");
      expect(employee.role).to.equal(1);
      expect(employee.isActive).to.equal(false);
    });

    it("Should add duplicate entries to allEmployees array", async function () {
      const { salaryContract, employee1 } = await loadFixture(deploySalaryManagementFixture);

      await salaryContract.addEmployee(employee1.address, "First Entry", 0, true);
      await salaryContract.addEmployee(employee1.address, "Second Entry", 1, false);

      const firstEntry = await salaryContract.allEmployees(0);
      const secondEntry = await salaryContract.allEmployees(1);

      expect(firstEntry.name).to.equal("First Entry");
      expect(secondEntry.name).to.equal("Second Entry");
    });

    it("Should handle zero amount transfers", async function () {
      const { salaryContract, owner, employee1 } = await loadFixture(deploySalaryManagementFixture);

      await salaryContract.addEmployee(owner.address, "Owner Employee", 0, true);

      const initialBalance = await hre.ethers.provider.getBalance(employee1.address);
      
      await salaryContract.transfer(employee1.address, 0);
      
      const finalBalance = await hre.ethers.provider.getBalance(employee1.address);
      expect(finalBalance).to.equal(initialBalance);
    });
  });

  describe("Contract Logic Issues (Testing Current Behavior)", function () {
    it("Should demonstrate the logic issue in can_receive_salary function", async function () {
      const { salaryContract, employee1 } = await loadFixture(deploySalaryManagementFixture);

      // Add an employee that's not Admin/Mentors/Security (impossible with current enum)
      // But we can test with a non-existent employee to show the logic issue
      
      // The function will return false for non-existent employees
      // because they don't match any role and !employee.isActive is true (since isActive defaults to false)
      const canReceive = await salaryContract.can_receive_salary(employee1.address);
      expect(canReceive).to.equal(false);
    });

    it("Should show that transfer function checks msg.sender eligibility instead of recipient", async function () {
      const { salaryContract, owner, employee1 } = await loadFixture(deploySalaryManagementFixture);

      // Add employee1 as eligible
      await salaryContract.addEmployee(employee1.address, "Eligible Employee", 0, true);
      
      // But owner (msg.sender) is not eligible
      // This should fail because it checks msg.sender, not the recipient
      await expect(
        salaryContract.transfer(employee1.address, hre.ethers.parseEther("1.0"), {
          value: hre.ethers.parseEther("1.0")
        })
      ).to.be.revertedWith("You are not eligible to receive salary");
    });
  });
});