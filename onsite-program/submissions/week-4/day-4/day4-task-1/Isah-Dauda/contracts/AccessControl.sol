// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IStaff {
    function registerStaff(address _staff, uint _salary, uint _role) external;
    function updateStaffStatus(address _staff, uint _status) external;
    function staffSalary(address _staff) external view returns (uint);
}

contract SchoolManagementStaff is IStaff {
    address public Chancellor;

    constructor() {
        Chancellor = msg.sender;
    }

    enum Status {
        EMPLOYED, UNEMPLOYED, PROBATION
    }

    enum Role {
        ADMIN, SECURITY, LECTURER
    }

    struct Staff {
        uint salary;
        Status status;
        Role role;
        bool isEmployed;
    }

    address[] public staffList;


    mapping(address => Staff) public staffData;

    // Errors
    error ONLY_CHANCELLOR();
    error ALREADY_REGISTERED();
    error NOT_REGISTERED();
    error NOT_EMPLOYED();
    error TRANSFER_FAILED();

    modifier onlyChancellor() {
        if (msg.sender != Chancellor) revert ONLY_CHANCELLOR();
        _;
    }

    function registerStaff(address _staff, uint _salary, uint _role) external override onlyChancellor {
        require(_role <= uint(Role.LECTURER), "Invalid Role");
        require(_salary > 0, "Salary must be greater than zero");

        if (staffData[_staff].isEmployed) revert ALREADY_REGISTERED();

        staffData[_staff] = Staff({
            salary: _salary,
            status: Status.EMPLOYED,
            role: Role(_role),
            isEmployed: true
        });

        staffList.push(_staff);
    }

    function updateStaffStatus(address _staff, uint _status) external override onlyChancellor {
        if (!staffData[_staff].isEmployed) revert NOT_REGISTERED();
        require(_status <= uint(Status.PROBATION), "Invalid status");

        staffData[_staff].status = Status(_status);
    }

    function fund() external payable {}

function payStaff(address payable _staff, uint _amount) external onlyChancellor {
    if (!staffData[_staff].isEmployed) revert NOT_REGISTERED();
    if (staffData[_staff].status != Status.EMPLOYED) revert NOT_EMPLOYED();
    if (_amount == 0 || address(this).balance < _amount) revert TRANSFER_FAILED();

    (bool sent, ) = _staff.call{value: _amount}("");
    if (!sent) revert TRANSFER_FAILED();

}

    function staffSalary(address _staff) external view override returns (uint) {
        if (!staffData[_staff].isEmployed) revert NOT_REGISTERED();
        return staffData[_staff].salary;
    }

    function getStaffDetails(address _staff) external view returns (uint, Status, Role) {
        if (!staffData[_staff].isEmployed) revert NOT_REGISTERED();
        Staff memory s = staffData[_staff];
        return (s.salary, s.status, s.role);
    }

function getAllStaffs() external view returns (
    address[] memory,
    uint[] memory,
    Status[] memory,
    Role[] memory
) {
    uint length = staffList.length;
    address[] memory addresses = new address[](length);
    uint[] memory salaries = new uint[](length);
    Status[] memory statuses = new Status[](length);
    Role[] memory roles = new Role[](length);

    for (uint i = 0; i < length; i++) {
        address staffAddr = staffList[i];
        Staff memory _staff = staffData[staffAddr];

        addresses[i] = staffAddr;
        salaries[i] = _staff.salary;
        statuses[i] = _staff.status;
        roles[i] = _staff.role;
    }

    return (addresses, salaries, statuses, roles);
}


    fallback() external payable {}
    receive() external payable {}
}