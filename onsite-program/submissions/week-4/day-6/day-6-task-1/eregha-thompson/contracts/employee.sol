// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

// interface Ipayment {
//     function makePayment() external;
// }

contract payroll {
    enum Status {
        EMPLOYED,
        UNEMPLOYED,
        PROBATION
    }

    struct Employee {
        uint256 UID;
        string name;
        uint256 salary;
        address owner;
        Status status;
    }
    error INVALID_REQUEST();

    Employee[] private employee;

    mapping(address => Employee[]) private employees;
    mapping(uint => uint) private UIDindex;
    uint256 private nextID;

    function register(string memory _name, uint256 _salary) external {
        Employee memory employed = Employee({
            name: _name,
            salary: _salary,
            status: Status.EMPLOYED,
            owner: msg.sender,
            UID: nextID
        });
        employee.push(employed);
        UIDindex[nextID] = employee.length - 1;
        nextID++;
        employees[msg.sender].push(employed);
    }

    function updateStatus(uint256 _UID, Status _status) external {
        if (employee[_UID].owner != msg.sender) {
            revert INVALID_REQUEST();
        }
        employee[_UID].status = _status;
        for (uint i; i < employees[msg.sender].length; i++) {
            if (employee[i].UID == _UID) {
                employee[i].status = _status;
            }
        }
    }







    function getUsers() external returns (Employee[] memory) {
        return employee;
    }
}
