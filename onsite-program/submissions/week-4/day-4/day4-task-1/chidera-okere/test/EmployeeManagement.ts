import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import hre from 'hardhat'

describe('EmployeeManagement', function () {
  async function deployEmployeeManagement() {
    // Get signers
    const [owner, addr1, addr2] = await hre.ethers.getSigners()

    const EmployeeManagement = await hre.ethers.getContractFactory('EmployeeManagement')
    const employeeManagement = await EmployeeManagement.deploy()

    // Wait for deployment
    await employeeManagement.waitForDeployment()

    return { employeeManagement, owner, addr1, addr2 }
  }

  describe('Deployment', function () {
    it('Should deploy successfully', async function () {
      const { employeeManagement } = await loadFixture(deployEmployeeManagement)
      expect(await employeeManagement.getAddress()).to.be.properAddress
    })
  })

  describe('Register Employee', function () {
    it('should register an employee', async function () {
      const { employeeManagement, addr1 } = await loadFixture(deployEmployeeManagement)

      const name = 'bundi'
      const role = 2

      // Now using uint8 instead of Role enum
      await employeeManagement.create_employee(name, role, addr1.address)

      const employee = await employeeManagement.getEmployee(addr1.address)

      expect(employee.name).to.equal(name)
      expect(employee.role).to.equal(role)
      expect(employee.status).to.equal(0) // EMPLOYED
      expect(employee.grantedAccess).to.be.true // MENTORS get access
      expect(employee.salary).to.equal(10) // MENTORS salary
    })

    it('should register a media team member', async function () {
      const { employeeManagement, addr1 } = await loadFixture(deployEmployeeManagement)

      await employeeManagement.create_employee('Alice', 0, addr1.address) // MEDIA_TEAM

      const employee = await employeeManagement.getEmployee(addr1.address)

      expect(employee.name).to.equal('Alice')
      expect(employee.role).to.equal(0) // MEDIA_TEAM
      expect(employee.grantedAccess).to.be.false // MEDIA_TEAM doesn't get access
      expect(employee.salary).to.equal(5) // MEDIA_TEAM salary
    })

    it('should register an engineer', async function () {
      const { employeeManagement, addr1 } = await loadFixture(deployEmployeeManagement)

      await employeeManagement.create_employee('Bob', 3, addr1.address) // ENGINEERS

      const employee = await employeeManagement.getEmployee(addr1.address)

      expect(employee.name).to.equal('Bob')
      expect(employee.role).to.equal(3) // ENGINEERS
      expect(employee.grantedAccess).to.be.true // ENGINEERS get access
      expect(employee.salary).to.equal(8) // ENGINEERS salary
    })
  })

  describe('Should revert for invalid parameters', function () {
    it('should revert if name is empty', async function () {
      const { employeeManagement, addr1 } = await loadFixture(deployEmployeeManagement)

      await expect(employeeManagement.create_employee('', 0, addr1.address)).to.be.revertedWith(
        'Name cannot be empty'
      )
    })

    it('should revert if role is not valid', async function () {
      const { employeeManagement, addr1 } = await loadFixture(deployEmployeeManagement)

      const name = 'bundi'
      const invalidRole = 5 // Invalid role (only 0-3 are valid)

      await expect(
        employeeManagement.create_employee(name, invalidRole, addr1.address)
      ).to.be.revertedWith('Invalid role')
    })
  })

  describe('Contract Balance', function () {
    it('should show initial balance as 0', async function () {
      const { employeeManagement } = await loadFixture(deployEmployeeManagement)

      const balance = await employeeManagement.getContractBalance()
      expect(balance).to.equal(0)
    })
  })

  describe('Pay Employee', function () {
    it('should pay an employed employee successfully', async function () {
      const { employeeManagement, addr1, owner } = await loadFixture(deployEmployeeManagement)

      // Create an employee (MENTORS role with salary of 10)
      await employeeManagement.create_employee('Alice', 2, addr1.address)

      // Fund the contract with enough ether (15 ether to be safe)
      await owner.sendTransaction({
        to: await employeeManagement.getAddress(),
        value: hre.ethers.parseEther('15')
      })

      // Check contract balance before payment
      const balanceBefore = await employeeManagement.getContractBalance()
      expect(balanceBefore).to.equal(hre.ethers.parseEther('15'))

      // Get employee's balance before payment
      const employeeBalanceBefore = await hre.ethers.provider.getBalance(addr1.address)

      // Pay the employee
      const tx = await employeeManagement.pay_employee(addr1.address)
      const receipt = await tx.wait()

      // Get employee's balance after payment
      const employeeBalanceAfter = await hre.ethers.provider.getBalance(addr1.address)

      // Check that employee received 10 ether (MENTORS salary)
      const expectedSalary = hre.ethers.parseEther('10')
      expect(employeeBalanceAfter - employeeBalanceBefore).to.equal(expectedSalary)

      // Check contract balance decreased
      const balanceAfter = await employeeManagement.getContractBalance()
      expect(balanceAfter).to.equal(hre.ethers.parseEther('5'))
    })

    it('should pay different salaries for different roles', async function () {
      const { employeeManagement, addr1, addr2, owner } = await loadFixture(
        deployEmployeeManagement
      )

      // Create employees with different roles
      await employeeManagement.create_employee('Media', 0, addr1.address) // MEDIA_TEAM (5 ether)
      await employeeManagement.create_employee('Engineer', 3, addr2.address) // ENGINEERS (8 ether)

      // Fund the contract with enough ether
      await owner.sendTransaction({
        to: await employeeManagement.getAddress(),
        value: hre.ethers.parseEther('20')
      })

      // Get balances before payment
      const mediaBalanceBefore = await hre.ethers.provider.getBalance(addr1.address)
      const engineerBalanceBefore = await hre.ethers.provider.getBalance(addr2.address)

      // Pay both employees
      await employeeManagement.pay_employee(addr1.address)
      await employeeManagement.pay_employee(addr2.address)

      // Get balances after payment
      const mediaBalanceAfter = await hre.ethers.provider.getBalance(addr1.address)
      const engineerBalanceAfter = await hre.ethers.provider.getBalance(addr2.address)

      // Check correct salary amounts
      expect(mediaBalanceAfter - mediaBalanceBefore).to.equal(hre.ethers.parseEther('5'))
      expect(engineerBalanceAfter - engineerBalanceBefore).to.equal(hre.ethers.parseEther('8'))
    })

    it('should revert when contract has insufficient balance', async function () {
      const { employeeManagement, addr1 } = await loadFixture(deployEmployeeManagement)

      // Create an employee
      await employeeManagement.create_employee('Bob', 2, addr1.address) // MENTORS (10 ether salary)

      // Don't fund the contract (balance = 0)

      // Try to pay employee - should revert
      await expect(employeeManagement.pay_employee(addr1.address)).to.be.revertedWith(
        'Insufficient contract balance'
      )
    })

    it('should revert when paying non-existent employee', async function () {
      const { employeeManagement, addr1, owner } = await loadFixture(deployEmployeeManagement)

      // Fund the contract
      await owner.sendTransaction({
        to: await employeeManagement.getAddress(),
        value: hre.ethers.parseEther('10')
      })

      // Try to pay an employee that doesn't exist
      // (addr1 was never added as an employee)
      await expect(employeeManagement.pay_employee(addr1.address)).to.be.revertedWith(
        'Employee not employed'
      )
    })

    it('should return the correct salary amount', async function () {
      const { employeeManagement, addr1, owner } = await loadFixture(deployEmployeeManagement)

      // Create kitchen staff (salary = 3 ether)
      await employeeManagement.create_employee('Chef', 1, addr1.address)

      // Fund the contract
      await owner.sendTransaction({
        to: await employeeManagement.getAddress(),
        value: hre.ethers.parseEther('5')
      })

      // Use callStatic to check return value without actually executing the transaction
      const returnValue = await employeeManagement.pay_employee.staticCall(addr1.address)
      expect(returnValue).to.equal(hre.ethers.parseEther('3'))

      // Then actually execute the payment
      await employeeManagement.pay_employee(addr1.address)
    })

    it('should handle multiple payments to same employee', async function () {
      const { employeeManagement, addr1, owner } = await loadFixture(deployEmployeeManagement)

      // Create an employee
      await employeeManagement.create_employee('Alice', 0, addr1.address) // MEDIA_TEAM (5 ether)

      // Fund the contract with enough for multiple payments
      await owner.sendTransaction({
        to: await employeeManagement.getAddress(),
        value: hre.ethers.parseEther('20')
      })

      const initialBalance = await hre.ethers.provider.getBalance(addr1.address)

      // Pay employee twice
      await employeeManagement.pay_employee(addr1.address)
      await employeeManagement.pay_employee(addr1.address)

      const finalBalance = await hre.ethers.provider.getBalance(addr1.address)

      // Should receive 10 ether total (5 + 5)
      expect(finalBalance - initialBalance).to.equal(hre.ethers.parseEther('10'))

      // Contract should have 10 ether left
      const contractBalance = await employeeManagement.getContractBalance()
      expect(contractBalance).to.equal(hre.ethers.parseEther('10'))
    })
  })
})
