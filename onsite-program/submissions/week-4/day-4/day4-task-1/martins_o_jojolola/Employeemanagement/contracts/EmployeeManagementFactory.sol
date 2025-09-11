// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./EmployeeManagement.sol";

contract EmployeeManagementFactory {
    error InvalidDeployerAddress(string reason);
    error EmptyCompanyName(string reason);

    struct CompanyInfo {
        string name;
        address deployedContract;
        address deployer;
        uint256 deploymentTimestamp;
    }

    address[] public deployedContracts;

    mapping(string => CompanyInfo) public companies;

    mapping(address => address[]) public deployerContracts;

    event EmployeeManagementDeployed(
        string indexed companyName,
        address indexed contractAddress,
        address indexed deployer,
        uint256 timestamp
    );

    function deployEmployeeManagement(
        string memory _companyName
    ) external returns (address) {
        if (msg.sender == address(0)) {
            revert InvalidDeployerAddress("Deployer address cannot be zero");
        }
        if (bytes(_companyName).length == 0) {
            revert EmptyCompanyName("Company name cannot be empty");
        }

        EmployeeManagement newContract = new EmployeeManagement();
        address contractAddress = address(newContract);

        companies[_companyName] = CompanyInfo({
            name: _companyName,
            deployedContract: contractAddress,
            deployer: msg.sender,
            deploymentTimestamp: block.timestamp
        });

        deployedContracts.push(contractAddress);
        deployerContracts[msg.sender].push(contractAddress);

        emit EmployeeManagementDeployed(
            _companyName,
            contractAddress,
            msg.sender,
            block.timestamp
        );

        return contractAddress;
    }

    function getCompanyContract(
        string memory _companyName
    ) external view returns (address) {
        return companies[_companyName].deployedContract;
    }

    function getCompanyInfo(
        string memory _companyName
    ) external view returns (CompanyInfo memory) {
        return companies[_companyName];
    }

    function getContractsByDeployer(
        address _deployer
    ) external view returns (address[] memory) {
        return deployerContracts[_deployer];
    }

    function getAllDeployedContracts()
        external
        view
        returns (address[] memory)
    {
        return deployedContracts;
    }

    function getDeployedContractsCount() external view returns (uint256) {
        return deployedContracts.length;
    }

    function hasCompanyDeployed(
        string memory _companyName
    ) external view returns (bool) {
        return companies[_companyName].deployedContract != address(0);
    }
}
