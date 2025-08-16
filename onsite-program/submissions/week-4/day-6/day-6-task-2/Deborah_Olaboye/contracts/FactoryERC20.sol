// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.28;

import "./IERC20.sol";
import "./ERC20.sol";

contract FactoryERC20 {
    struct companyDetails {
        string companyName;
        address owner;
        address companyAddress;
    }

    companyDetails[] public companies;
    mapping(address => address[]) public companyByOwner;

    function createCompany(string memory _companyName, address _owner) external returns(address) {
        require(bytes(_companyName).length > 0, "Company name cannot be empty");

        TMS newCompany = new TMS(_companyName, _owner);
        address companyAddress = address(newCompany);

        companies.push(companyDetails({companyName: _companyName,
            owner: _owner,
            companyAddress: companyAddress
        }));

        companyByOwner[_owner].push(companyAddress);

        return companyAddress;
    }

    function getCompany(uint256 _companyId) public view returns (ITMS.Teacher[] memory) {
    require(_companyId < companies.length, "Company does not exist");
    return ITMS(companies[_companyId].companyAddress).ViewTeachers();
    }
    function getAllCompanies() external view returns(companyDetails[] memory) {
        return companies;
    }
}
