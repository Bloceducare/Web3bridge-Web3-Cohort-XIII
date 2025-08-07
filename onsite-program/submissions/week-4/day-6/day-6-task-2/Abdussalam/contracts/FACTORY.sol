// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./AMAS.sol";

contract Factory {
    AMAS[] public listOfAmasContracts;

    function CreateNewAmas(
        string memory _symbol,
        string memory _name,
        uint8 _decimals,
        uint totalsuply_
    ) public {
        listOfAmasContracts.push(
            new AMAS(_symbol, _name, _decimals, totalsuply_)
        );
    }

    function getAllAMAS() public view returns (AMAS[] memory) {
        return listOfAmasContracts;
    }

    function getnameOfAMAS(uint index) public view returns (string memory) {
        require(index < listOfAmasContracts.length, "Index out of bounds");
        return listOfAmasContracts[index].name();
    }

    function getSymbolOfAMAS(uint index) public view returns (string memory) {
        require(index < listOfAmasContracts.length, "Index out of bounds");
        return listOfAmasContracts[index].symbol();
    }

    function getDecimalOfAMAS(uint index) public view returns (uint8) {
        require(index < listOfAmasContracts.length, "Index out of bounds");
        return listOfAmasContracts[index].decimals();
    }

    function getTotalSupplyOfAMAS(uint index) public view returns (uint) {
        require(index < listOfAmasContracts.length, "Index out of bounds");
        return listOfAmasContracts[index].totalsupply();
    }
}
