# School Management System

A decentralized school management system built with Solidity for managing student records and tracking their academic status on the blockchain.

## 🎯 Features

- **Student Registration**: Register new students with comprehensive details
- **Status Management**: Track student status (Active, Deferred, Rusticated)
- **CRUD Operations**: Create, Read, Update, and Delete student records
- **Unique ID System**: Each student gets a permanent, unique identifier
- **Gender Tracking**: Support for Male, Female, and Other gender options
- **Secure Data Management**: Blockchain-based immutable record keeping

## 🏗️ Contract Architecture

### Enums
```solidity
enum Status { ACTIVE, DEFERRED, RUSTICATED }
enum Sex { MALE, FEMALE, OTHER }
```

### Student Structure
```solidity
struct Student {
    uint256 id;
    string name;
    string telephone_number;
    uint8 age;
    Sex sex;
    Status status;
    bool exists;
}
```

## 📋 Contract Functions

### Core Functions

| Function | Description | Access |
|----------|-------------|---------|
| `registerStudent()` | Register a new student | External |
| `getStudent()` | Get student details by ID | External View |
| `updateStudent()` | Update student information | External |
| `deleteStudent()` | Mark student as deleted | External |
| `changeStudentStatus()` | Update student status | External |
| `getAllStudents()` | Get all students (including deleted) | External View |
| `getAllActiveStudents()` | Get only active students | External View |

### Function Signatures

```solidity
function registerStudent(
    string calldata _name,
    string calldata _telephone_number,
    uint8 _age,
    Sex _sex
) external

function updateStudent(
    uint256 _studentID,
    string calldata _name,
    string calldata _telephone_number,
    uint8 _age,
    Sex _sex
) external

function changeStudentStatus(
    uint256 _studentID,
    Status _status
) external
```


## 🔒 Security Features

- **Input Validation**: All functions include proper validation
- **Access Control**: External functions with proper modifiers
- **Safe Deletion**: Soft delete preserves data integrity
- **Unique IDs**: Prevents ID collision and ensures data consistency
- **Existence Checks**: Prevents operations on deleted records

## 🛠️ Technical Specifications

- **Solidity Version**: ^0.8.28
- **License**: MIT
- **Framework**: Hardhat
- **Deployment**: Hardhat Ignition

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Deployed Contract**: [View on Lisk Sepolia](https://sepolia-blockscout.lisk.com/address/0x0C8E9755dd8F2B91cF5E517F923d4AD87c93E069?tab=contract)
- **Lisk Documentation**: [docs.lisk.com](https://docs.lisk.com)
- **Hardhat Documentation**: [hardhat.org](https://hardhat.org)

## ⚠️ Disclaimer

This is an educational project demonstrating smart contract development with Solidity. Not recommended for production use without additional security audits and testing.

