import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import {ethers} from "hardhat"
import hre from "hardhat";
import { EmployeeManagementSystem__factory } from "../typechain-types";

describe("EmployeeManagement",function(){
  async function deployEmployeeManagementSystem(){
  const [owner,otherAccount] = await hre.ethers.getSigners()
  const EmployeeManagementSystem = await hre.ethers.getContractFactory("EmployeeManagementSystem");
  const employeeManagementSystem = await EmployeeManagementSystem.deploy();
  return {employeeManagementSystem,owner,otherAccount};
}

describe("EmployeeManagementSystem", function () {
  describe("Register Employee", function () {
    it("Should register employee successfully", async function () {
      const { employeeManagementSystem, owner } = await loadFixture(deployEmployeeManagementSystem);
      const address = owner.address;
      const name = "Daniel";
      const age = 25;
      const salary = ethers.parseEther("2");
      const role = 0;

  
      await employeeManagementSystem.registerEmployee(address, name, age, salary, role);

      const employee =  await employeeManagementSystem.getEmployee(address);
      console.log("Employee data:", employee);

      expect(employee.name).to.equal(name);
  
    });

    it("Should revert if employee has already been employed",async function(){
      const { employeeManagementSystem, owner } = await loadFixture(deployEmployeeManagementSystem);
      const address = owner.address;
      const name = "Daniel";
      const age = 25;
      const salary = ethers.parseEther("2");
      const role = 1;
      await employeeManagementSystem.registerEmployee(address, name, age, salary, role);

      await expect(employeeManagementSystem.registerEmployee(address, name, age, salary, role)).to.be.revertedWith("Employee is already Employed");

    })

  });

  describe("Pay Employee Salary",function(){
    it("Should pay employee salary if employee is an admin",async function(){
      const { employeeManagementSystem, owner,otherAccount } = await loadFixture(deployEmployeeManagementSystem);
      const address = owner.address;
      const name = "Daniel";
      const age = 25;
      const salary = ethers.parseEther("2");
      const role = 0;

      await employeeManagementSystem.registerEmployee(address, name, age, salary, role);
      await employeeManagementSystem.registerEmployee(otherAccount.address,name,age,salary,2);
      const amount = ethers.parseEther("2");

      await employeeManagementSystem.connect(otherAccount).payEmployeeSalary(address,amount);
      const employee =  await employeeManagementSystem.getEmployee(address);
      // expect()


      })

      it("Should not pay employee if the sender is not an admin",async function(){
      const { employeeManagementSystem, owner,otherAccount } = await loadFixture(deployEmployeeManagementSystem);
      const address = owner.address;
      const name = "Daniel";
      const age = 25;
      const salary = ethers.parseEther("2");
      const role = 0;

      await employeeManagementSystem.registerEmployee(address, name, age, salary, role);
      await employeeManagementSystem.registerEmployee(otherAccount.address,name,age,salary,1);
      const amount = ethers.parseEther("2");
      await expect(employeeManagementSystem.payEmployeeSalary(address,)).to.be.revertedWith("Employee is already Employed");




      })
  })

})

  
  
})

// describe("Lock", function () {
//   // We define a fixture to reuse the same setup in every test.
//   // We use loadFixture to run this setup once, snapshot that state,
//   // and reset Hardhat Network to that snapshot in every test.
//   async function deployOneYearLockFixture() {
//     const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
//     const ONE_GWEI = 1_000_000_000;

//     const lockedAmount = ONE_GWEI;
//     const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

//     // Contracts are deployed using the first signer/account by default
//     const [owner, otherAccount] = await hre.ethers.getSigners();

//     const Lock = await hre.ethers.getContractFactory("Lock");
//     const lock = await Lock.deploy(unlockTime, { value: lockedAmount });

//     return { lock, unlockTime, lockedAmount, owner, otherAccount };
//   }

//   describe("Deployment", function () {
//     it("Should set the right unlockTime", async function () {
//       const { lock, unlockTime } = await loadFixture(deployOneYearLockFixture);

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
