interface IEmployeeManagementSystem {
    function registerEmployee(address employee, uint8 employeeType, uint256 salary) external;
    function isEmployed(address employee) external view returns (bool);
    function payout(address employee) external payable;
    function getAllEmployees() external view returns (address[] memory);
    function getEmployeeDetails(address employee) external view returns (uint8, uint256, uint8, uint256);
    function setEmploymentStatus(address employee, uint8 status) external;
}
