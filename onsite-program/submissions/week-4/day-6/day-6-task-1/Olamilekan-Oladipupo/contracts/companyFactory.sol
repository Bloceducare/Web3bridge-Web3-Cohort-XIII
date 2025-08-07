// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "./Company.sol";


contract CompanyFactory {
    address [] companysAddresses;

    function createCompany(address _ownersAddress) external {
        Company newCompany = new Company(_ownersAddress);
        address contractAddress = address(newCompany);
        companysAddresses.push(contractAddress);
    }

    function getCompanyAddresses() external view returns (address [] memory){
        return companysAddresses;
    }
}