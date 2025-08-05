const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Digital Security System', function () {
  let contract
  let owner
  let employee1
  let employee2
  let employee3

  // Role enum values
  const Role = {
    MEDIA_TEAM: 0,
    MANAGERS: 1,
    MENTORS: 2,
    SOCIAL_MEDIA_TEAM: 3,
    TECHNICIAN_SUPERVISORS: 4,
    KITCHEN_STAFF: 5
  }

  const Status = {
    EMPLOYED: 0,
    TERMINATED: 1
  }

  beforeEach(async function () {
    ;[owner, employee1, employee2, employee3] = await ethers.getSigners()

    const Contract = await ethers.getContractFactory('digital_security_system')
    contract = await Contract.deploy()
    await contract.waitForDeployment()
  })

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      expect(await contract.owner()).to.equal(owner.address)
    })

    it('Should start with zero employees', async function () {
      expect(await contract.getTotalEmployees()).to.equal(0)
    })
  })

  describe('Salary Assignment', function () {
    it('Should return correct hardcoded salaries for each role', async function () {
      expect(await contract.getSalaryByRole(Role.MEDIA_TEAM)).to.equal(ethers.parseEther('2'))
      expect(await contract.getSalaryByRole(Role.MANAGERS)).to.equal(ethers.parseEther('5'))
      expect(await contract.getSalaryByRole(Role.MENTORS)).to.equal(ethers.parseEther('3'))
      expect(await contract.getSalaryByRole(Role.SOCIAL_MEDIA_TEAM)).to.equal(
        ethers.parseEther('1.5')
      )
      expect(await contract.getSalaryByRole(Role.TECHNICIAN_SUPERVISORS)).to.equal(
        ethers.parseEther('4')
      )
      expect(await contract.getSalaryByRole(Role.KITCHEN_STAFF)).to.equal(ethers.parseEther('1'))
    })
  })

  describe('Employee Management', function () {
    it('Should add employee successfully', async function () {
      await contract.addEmployee(employee1.address, 'Alice Manager', Role.MANAGERS)

      expect(await contract.getTotalEmployees()).to.equal(1)
      expect(await contract.isEmployee(employee1.address)).to.be.true

      const employeeDetails = await contract.getEmployeeDetails(employee1.address)
      expect(employeeDetails[0]).to.equal('Alice Manager') // name
      expect(employeeDetails[1]).to.equal(Role.MANAGERS) // role
      expect(employeeDetails[2]).to.equal(Status.EMPLOYED) // status
      expect(employeeDetails[3]).to.equal(ethers.parseEther('5')) // salary
    })

    it('Should only allow owner to add employees', async function () {
      await expect(
        contract.connect(employee1).addEmployee(employee2.address, 'Bob', Role.MEDIA_TEAM)
      ).to.be.revertedWith('Only owner can perform this action')
    })

    it('Should reject invalid addresses', async function () {
      await expect(
        contract.addEmployee(ethers.ZeroAddress, 'Invalid', Role.MANAGERS)
      ).to.be.revertedWith('Invalid address')
    })

    it('Should reject empty names', async function () {
      await expect(contract.addEmployee(employee1.address, '', Role.MANAGERS)).to.be.revertedWith(
        'Name cannot be empty'
      )
    })
  })

  describe('Employee Status Updates', function () {
    beforeEach(async function () {
      await contract.addEmployee(employee1.address, 'Alice', Role.MANAGERS)
    })

    it('Should update employee status', async function () {
      await contract.updateEmployeeStatus(employee1.address, Status.TERMINATED)

      const employeeDetails = await contract.getEmployeeDetails(employee1.address)
      expect(employeeDetails[2]).to.equal(Status.TERMINATED)
    })

    it('Should only allow owner to update status', async function () {
      await expect(
        contract.connect(employee1).updateEmployeeStatus(employee1.address, Status.TERMINATED)
      ).to.be.revertedWith('Only owner can perform this action')
    })

    it('Should reject status update for non-existent employee', async function () {
      await expect(
        contract.updateEmployeeStatus(employee2.address, Status.TERMINATED)
      ).to.be.revertedWith('Employee does not exist')
    })
  })

  describe('Access Control', function () {
    beforeEach(async function () {
      await contract.addEmployee(employee1.address, 'Alice Manager', Role.MANAGERS)
      await contract.addEmployee(employee2.address, 'Bob Kitchen', Role.KITCHEN_STAFF)
      await contract.addEmployee(employee3.address, 'Charlie Media', Role.MEDIA_TEAM)
    })

    it('Should grant access to authorized roles', async function () {
      expect(await contract.checkAccess(employee1.address)).to.be.true // MANAGERS
      expect(await contract.checkAccess(employee3.address)).to.be.true // MEDIA_TEAM
    })

    it('Should deny access to unauthorized roles', async function () {
      expect(await contract.checkAccess(employee2.address)).to.be.false // KITCHEN_STAFF
    })

    it('Should deny access to terminated employees', async function () {
      await contract.updateEmployeeStatus(employee1.address, Status.TERMINATED)
      expect(await contract.checkAccess(employee1.address)).to.be.false
    })

    it('Should deny access to non-existent employees', async function () {
      const [, , , , nonEmployee] = await ethers.getSigners()
      expect(await contract.checkAccess(nonEmployee.address)).to.be.false
    })
  })

  describe('Payment System', function () {
    beforeEach(async function () {
      await contract.addEmployee(employee1.address, 'Alice Manager', Role.MANAGERS)
      await contract.addEmployee(employee2.address, 'Bob Kitchen', Role.KITCHEN_STAFF)

      // Fund the contract
      await owner.sendTransaction({
        to: await contract.getAddress(),
        value: ethers.parseEther('10')
      })
    })

    it('Should pay employee correctly', async function () {
      const initialBalance = await ethers.provider.getBalance(employee1.address)

      await contract.payEmployee(employee1.address)

      const finalBalance = await ethers.provider.getBalance(employee1.address)
      const expectedSalary = ethers.parseEther('5') // MANAGERS salary

      expect(finalBalance - initialBalance).to.equal(expectedSalary)
    })

    it('Should update last payment timestamp', async function () {
      await contract.payEmployee(employee1.address)

      const employeeDetails = await contract.getEmployeeDetails(employee1.address)
      expect(employeeDetails[4]).to.be.greaterThan(0) // lastPayment should be set
    })

    it('Should only allow owner to pay employees', async function () {
      await expect(contract.connect(employee1).payEmployee(employee1.address)).to.be.revertedWith(
        'Only owner can perform this action'
      )
    })

    it('Should reject payment to non-existent employee', async function () {
      await expect(contract.payEmployee(employee3.address)).to.be.revertedWith(
        'Employee does not exist'
      )
    })

    it('Should reject payment to terminated employee', async function () {
      await contract.updateEmployeeStatus(employee1.address, Status.TERMINATED)

      await expect(contract.payEmployee(employee1.address)).to.be.revertedWith(
        'Employee is terminated'
      )
    })

    it('Should reject payment when insufficient balance', async function () {
      // Add high-salary employee that exceeds contract balance
      await contract.addEmployee(employee3.address, 'Charlie', Role.MANAGERS)

      // Pay first employee (5 ETH)
      await contract.payEmployee(employee1.address)

      // Try to pay second manager (another 5 ETH, but only ~5 ETH left)
      await expect(contract.payEmployee(employee3.address)).to.be.revertedWith(
        'Insufficient contract balance'
      )
    })
  })

  describe('Contract Balance and Expenses', function () {
    beforeEach(async function () {
      await contract.addEmployee(employee1.address, 'Alice Manager', Role.MANAGERS)
      await contract.addEmployee(employee2.address, 'Bob Kitchen', Role.KITCHEN_STAFF)
    })

    it('Should track contract balance correctly', async function () {
      const fundAmount = ethers.parseEther('5')
      await owner.sendTransaction({
        to: await contract.getAddress(),
        value: fundAmount
      })

      expect(await contract.getContractBalance()).to.equal(fundAmount)
    })

    it('Should calculate total salary expense correctly', async function () {
      const totalExpense = await contract.getTotalSalaryExpense()
      const expectedTotal = ethers.parseEther('6') // 5 ETH (MANAGERS) + 1 ETH (KITCHEN_STAFF)

      expect(totalExpense).to.equal(expectedTotal)
    })

    it('Should exclude terminated employees from salary calculation', async function () {
      await contract.updateEmployeeStatus(employee1.address, Status.TERMINATED)

      const totalExpense = await contract.getTotalSalaryExpense()
      const expectedTotal = ethers.parseEther('1') // Only KITCHEN_STAFF (1 ETH)

      expect(totalExpense).to.equal(expectedTotal)
    })
  })

  describe('Withdrawal', function () {
    beforeEach(async function () {
      // Fund the contract
      await owner.sendTransaction({
        to: await contract.getAddress(),
        value: ethers.parseEther('5')
      })
    })

    it('Should allow owner to withdraw funds', async function () {
      const withdrawAmount = ethers.parseEther('2')
      const initialOwnerBalance = await ethers.provider.getBalance(owner.address)

      const tx = await contract.withdraw(withdrawAmount)
      const receipt = await tx.wait()
      const gasUsed = receipt.gasUsed * receipt.gasPrice

      const finalOwnerBalance = await ethers.provider.getBalance(owner.address)
      const expectedBalance = initialOwnerBalance + withdrawAmount - gasUsed

      expect(finalOwnerBalance).to.be.closeTo(expectedBalance, ethers.parseEther('0.01'))
    })

    it('Should only allow owner to withdraw', async function () {
      await expect(contract.connect(employee1).withdraw(ethers.parseEther('1'))).to.be.revertedWith(
        'Only owner can perform this action'
      )
    })

    it('Should reject withdrawal of more than balance', async function () {
      await expect(contract.withdraw(ethers.parseEther('10'))).to.be.revertedWith(
        'Insufficient balance'
      )
    })
  })

  describe('Employee Queries', function () {
    beforeEach(async function () {
      await contract.addEmployee(employee1.address, 'Alice Manager', Role.MANAGERS)
      await contract.addEmployee(employee2.address, 'Bob Kitchen', Role.KITCHEN_STAFF)
      await contract.addEmployee(employee3.address, 'Charlie Media', Role.MEDIA_TEAM)
    })

    it('Should return all employees', async function () {
      const allEmployees = await contract.getAllEmployees()
      expect(allEmployees.length).to.equal(3)
    })

    it('Should return employees by role', async function () {
      const managers = await contract.getEmployeesByRole(Role.MANAGERS)
      expect(managers.length).to.equal(1)
      expect(managers[0].name).to.equal('Alice Manager')
    })

    it('Should return correct total employee count', async function () {
      expect(await contract.getTotalEmployees()).to.equal(3)
    })
  })
})
