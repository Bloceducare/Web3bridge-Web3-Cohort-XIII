# Garage Access Control Smart Contract

This project is a Solidity smart contract for managing employee access to the Web3Bridge garage using their wallet addresses as digital keycards.

## Project Overview

The system allows a designated `Manager` to add, update, and manage a list of employees. It enforces a specific set of rules to determine if an employee is granted access to the garage based on their role and employment status.

### Access Rules

Access to the garage is determined by the following logic:
- An employee's employment **Status** must be `ACTIVE`.
- Terminated employees can **never** access the garage, regardless of their previous role.
- The employee's **Role** must be one of the following:
    - `MANAGER`
    - `MENTOR`
    - `MEDIA_TEAM`

Other roles such as `SOCIAL_MEDIA_TEAM`, `TECHNICIAN_SUPERVISOR`, and `KITCHEN_STAFF` are tracked by the system but do not have garage access.

### Core Functions

- **`setEmployee(address, name, role, status)`**: A manager-only function to add a new employee or update an existing one's details.
- **`canAccessGarage(address)`**: A public function that checks if a given employee address has permission to enter the garage.
- **`getEmployee(address)`**: A public function to retrieve the details of a specific employee.
- **`getAllEmployees()`**: A public function that returns a list of all employees ever registered in the system.