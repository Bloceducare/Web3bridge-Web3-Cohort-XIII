# Digital Security System Smart Contract

A Solidity smart contract for managing access to the Web3Bridge garage using digital keycards and role-based permissions.

## Contract Address

**Lisk Testnet:** `0x1a85F5388C161C30470482A41Cd4a7d4bC3DeA7c`

## Overview

This smart contract manages employee access to a garage facility based on their roles and employment status. The system uses Ethereum wallet addresses as digital keycards and implements role-based access control.

## Features

- **Role-based Access Control**: Different employee roles with specific garage access permissions
- **Employment Status Tracking**: Active employees vs terminated employees
- **Dual Storage System**: Uses both mappings for O(1) lookups and arrays for iteration
- **Complete CRUD Operations**: Add, update, retrieve, and list employees

## Access Permissions

### Can Access Garage ✅

- Media Team
- Managers
- Mentors

### Cannot Access Garage ❌

- Social Media Team
- Technician Supervisors
- Kitchen Staff
- Any terminated employee (regardless of role)

## Contract Functions

### Core Functions

- `addEmployee(address, string, Role)` - Add or update an employee
- `checkAccess(address)` - Check if an employee can access the garage
- `getAllEmployees()` - Get list of all employees
- `getEmployeeDetails(address)` - Get specific employee information
- `updateEmployeeStatus(address, Status)` - Update employment status
- `getTotalEmployees()` - Get total number of employees

### Data Structures

```solidity
enum Role {
    MEDIA_TEAM,
    MANAGERS,
    MENTORS,
    SOCIAL_MEDIA_TEAM,
    TECHNICIAN_SUPERVISORS,
    KITCHEN_STAFF
}

enum Status {
    EMPLOYED,
    TERMINATED
}

struct EmployeeData {
    string name;
    Role role;
    Status status;
}
```

## Deployment

### Prerequisites

- Node.js and npm
- Hardhat development environment
- Lisk Testnet RPC configuration

### Deploy Command

```bash
npx hardhat ignition deploy ignition/modules/DigitalSecuritySystem.ts --network liskTestnet --deployment-id sepolia-deployment
```

### Deployment Output

```
✔ Confirm deploy to network liskTestnet (4202)? … yes
Compiled 1 Solidity file successfully (evm target: paris).
Hardhat Ignition 🚀
Deploying [ DigitalSecuritySystemModule ]
Batch #1
  Executed DigitalSecuritySystemModule#digital_security_system
[ DigitalSecuritySystemModule ] successfully deployed 🚀
Deployed Addresses
DigitalSecuritySystemModule#digital_security_system - 0x1a85F5388C161C30470482A41Cd4a7d4bC3DeA7c
```

## Usage Examples

### Adding an Employee

```javascript
await contract.addEmployee(
  '0x742d35Cc6635C0532925a3b8D2AF5ABCD6aA9847',
  'John Smith',
  1 // MANAGERS
)
```

### Checking Access

```javascript
const hasAccess = await contract.checkAccess('0x742d35Cc6635C0532925a3b8D2AF5ABCD6aA9847')
console.log(hasAccess) // true (Manager can access)
```

### Terminating an Employee

```javascript
await contract.updateEmployeeStatus(
  '0x742d35Cc6635C0532925a3b8D2AF5ABCD6aaa9847',
  1 // TERMINATED
)
```

### Getting All Employees

```javascript
const allEmployees = await contract.getAllEmployees()
console.log(allEmployees)
```

## Network Information

- **Network:** Lisk Testnet
- **Chain ID:** 4202
- **Contract Address:** 0x1a85F5388C161C30470482A41Cd4a7d4bC3DeA7c

## Security Features

- Prevents duplicate entries in employee array
- Validates employee existence before operations
- Role-based access control with automatic denial for terminated employees
- Gas-optimized storage with mapping + array combination

## Development

### Local Setup

```bash
npm install
npx hardhat compile
npx hardhat test
```

### Verify Contract

```bash
npx hardhat verify --network liskTestnet 0x1a85F5388C161C30470482A41Cd4a7d4bC3DeA7c
```

## License

MIT License

# Digital Security System - Employee Management Guide

## What This Contract Does

This is a digital security system that manages employees with different roles and hardcoded salaries. It also controls access to the system based on employee roles.

## Employee Roles & Salaries

Each role has a fixed salary that cannot be changed:

| Role                   | Monthly Salary | Access Level   |
| ---------------------- | -------------- | -------------- |
| MANAGERS               | 5 ETH          | ✅ Full Access |
| TECHNICIAN_SUPERVISORS | 4 ETH          | ❌ No Access   |
| MENTORS                | 3 ETH          | ✅ Full Access |
| MEDIA_TEAM             | 2 ETH          | ✅ Full Access |
| SOCIAL_MEDIA_TEAM      | 1.5 ETH        | ❌ No Access   |
| KITCHEN_STAFF          | 1 ETH          | ❌ No Access   |

## Key Features

- Register employees with wallet addresses and roles
- Automatic salary assignment based on role
- Pay individual employees or all at once
- Access control system (only some roles get system access)
- Track employment status and payment history

## How to Use

### 1. Deploy the Contract

The deployer becomes the owner and can manage all employees.

### 2. Fund the Contract

```solidity
// Send ETH to contract address for salary payments
```

### 3. Add an Employee

```solidity
addEmployee(0x123..., "John Smith", Role.MANAGERS)
// Address: Employee's wallet
// Name: John Smith
// Role: MANAGERS (gets 5 ETH salary automatically)
```

### 4. Pay Employees

```solidity
payEmployee(0x123...) // Pay specific employee
payAllEmployees()     // Pay all employed staff
```

### 5. Check Access

```solidity
checkAccess(0x123...) // Returns true if employee has system access
```

## Important Functions

| Function                  | What It Does                                      |
| ------------------------- | ------------------------------------------------- |
| `addEmployee()`           | Add new employee with role (salary auto-assigned) |
| `payEmployee()`           | Pay salary to specific employee's wallet          |
| `payAllEmployees()`       | Pay all employed staff at once                    |
| `updateEmployeeStatus()`  | Change status (EMPLOYED/TERMINATED)               |
| `checkAccess()`           | Check if employee has system access               |
| `getSalaryByRole()`       | View salary amount for any role                   |
| `getEmployeesByRole()`    | Get all employees in specific role                |
| `getTotalSalaryExpense()` | Calculate total monthly payroll                   |

## Access Control System

Only these roles get system access:

- **MANAGERS** (5 ETH)
- **MENTORS** (3 ETH)
- **MEDIA_TEAM** (2 ETH)

Other roles are blocked from system access but still get paid.

## Example Usage Flow

1. Deploy contract → You become owner
2. Send 20 ETH to contract → Fund for payments
3. Add manager: `addEmployee(0xABC, "Alice", MANAGERS)` → Alice gets 5 ETH salary
4. Add kitchen staff: `addEmployee(0xDEF, "Bob", KITCHEN_STAFF)` → Bob gets 1 ETH salary
5. Pay Alice: `payEmployee(0xABC)` → 5 ETH sent to Alice's wallet
6. Check Alice's access: `checkAccess(0xABC)` → Returns true
7. Check Bob's access: `checkAccess(0xDEF)` → Returns false

## Security Features

- Only owner can add/update employees
- Employees must exist before payments
- Terminated employees cannot be paid
- Contract checks balance before payments
- Access control based on role hierarchy

This system combines payroll management with digital access control, perfect for organizations needing both financial and security management.
