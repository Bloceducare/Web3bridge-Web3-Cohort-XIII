import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("AccessMgt", function () {
  async function deployAccessMgt() {
    const [owner] = await hre.ethers.getSigners();

    const AccessMgt = await hre.ethers.getContractFactory("AccessMgt");
    const access = await AccessMgt.deploy();

    return { access, owner };
  };
  describe("Add Employee", ()=>{
    it("should register a new employee", async ()=>{
      const {access} = await loadFixture(deployAccessMgt);
      const _address = "0x925c164A113D7fbF28D31f4838A39c30Ee881c9e";
      await access.add_and_update_Employee("Jeffrey", 2, _address);
      expect((await access.getEmployees())[0].isEmployed).to.be.true
    });
    it("should update the employee details correctly", async()=>{
      const {access} = await loadFixture(deployAccessMgt);
      const _address = "0x925c164A113D7fbF28D31f4838A39c30Ee881c9e";
      await access.add_and_update_Employee("Jeffrey", 2, _address);
      expect((await access.getEmployees())[0].name).to.equal("Jeffrey");
      expect((await access.getEmployees())[0].role).to.equal(2);
      expect((await access.getEmployees())[0].isEmployed).to.be.true;
    });
    it("should update employee array", async ()=>{
      const {access} = await loadFixture(deployAccessMgt);
      const _address = "0x925c164A113D7fbF28D31f4838A39c30Ee881c9e";
      await access.add_and_update_Employee("Jeffrey", 2, _address);
      expect(await access.getEmployeeCount()).to.equal(1);      
    })
  })
  describe("update employee", ()=>{
    it("should update existing employee record", async()=>{
      const {access} = await loadFixture(deployAccessMgt);
      const _address = "0x925c164A113D7fbF28D31f4838A39c30Ee881c9e";
      await access.add_and_update_Employee("Jeffrey", 2, _address);
      expect((await access.getEmployees())[0].role).to.equal(2);
      await access.add_and_update_Employee("Jeffrey", 1, _address);
      expect((await access.getEmployees())[0].role).to.equal(1);
    });
  });
  describe("Full Access", ()=>{
    it("Should grant access to authorized persons", async()=>{
      const {access} = await loadFixture(deployAccessMgt);
      const _address = "0x925c164A113D7fbF28D31f4838A39c30Ee881c9e";
      await access.add_and_update_Employee("Jeffrey", 2, _address);
      expect (await access.fullAccess(_address)).to.be.true;
    })
    it("should reject access for unauthorized persons", async()=>{
       const {access} = await loadFixture(deployAccessMgt);
      const _address = "0xE8E0Ae7555f1a9a0479b97a86ACca2Dc81bf9922";
      await access.add_and_update_Employee("Sharon", 5, _address);
      expect (await access.fullAccess(_address)).to.be.false;
    })
  })
  describe("Terminate Employee", ()=>{
    it("should remove an employee", async()=>{
      const {access} = await loadFixture(deployAccessMgt);
      const _address = "0x925c164A113D7fbF28D31f4838A39c30Ee881c9e";
      const _address2 = "0xE8E0Ae7555f1a9a0479b97a86ACca2Dc81bf9922";
      await access.add_and_update_Employee("Jeffrey", 2, _address);
      await access.add_and_update_Employee("Sharon", 5, _address2);
      expect ((await access.roles(_address)).isEmployed).to.be.true;
      expect ((await access.roles(_address2)).isEmployed).to.be.true;
      await access.terminateEmployee(_address2);
      expect ((await access.roles(_address2)).isEmployed).to.be.false;
    });
    it("Should update employee count", async ()=>{
      const {access} = await loadFixture(deployAccessMgt);
      const _address = "0x925c164A113D7fbF28D31f4838A39c30Ee881c9e";
      const _address2 = "0xE8E0Ae7555f1a9a0479b97a86ACca2Dc81bf9922";
      await access.add_and_update_Employee("Jeffrey", 2, _address);
      await access.add_and_update_Employee("Sharon", 5, _address2);
      expect (await access.getEmployeeCount()).to.equal(2);
      await access.terminateEmployee(_address2);
      expect (await access.getEmployeeCount()).to.equal(1);
    });
  });
});
