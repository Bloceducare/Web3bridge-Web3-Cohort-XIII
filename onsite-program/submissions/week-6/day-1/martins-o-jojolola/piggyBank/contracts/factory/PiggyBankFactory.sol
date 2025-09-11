// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./../PiggyBank.sol";
import "./../lib/Errors.sol";

contract PiggyBankFactory {
    using Errors for *;
    address public admin;
    address[] public allPiggyBanks;
    mapping(address => address[]) public ownerToBanks;

    event PiggyBankCreated(
        address indexed piggyBank,
        address indexed owner,
        address indexed admin
    );

    constructor() {
        admin = msg.sender;
    }

    function createPiggyBank(address owner) external returns (address) {
        if (owner == address(0)) revert Errors.InvalidAddress();

        PiggyBank bank = new PiggyBank(owner, admin);
        address bankAddr = address(bank);

        allPiggyBanks.push(bankAddr);
        ownerToBanks[owner].push(bankAddr);

        emit PiggyBankCreated(bankAddr, owner, admin);
        return bankAddr;
    }

    function getAllPiggyBanks() external view returns (address[] memory) {
        return allPiggyBanks;
    }

    function getPiggyBanksByOwner(
        address owner
    ) external view returns (address[] memory) {
        return ownerToBanks[owner];
    }

    function totalPiggyBanks() external view returns (uint256) {
        return allPiggyBanks.length;
    }
}
