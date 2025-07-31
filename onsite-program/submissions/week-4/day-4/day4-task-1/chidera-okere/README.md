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
