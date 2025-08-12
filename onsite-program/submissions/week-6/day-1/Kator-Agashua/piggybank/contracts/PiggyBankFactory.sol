// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);
    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

import {PiggyBank} from "./PiggyBank.sol";

// Factory Contract
contract PiggyBankFactory {
    address[] public deployedPiggyBanks;
    mapping(address => address[]) public userPiggyBanks;

    event PiggyBankCreated(address indexed piggyBank, address indexed creator);

    function createPiggyBank() external returns (address) {
        PiggyBank newPiggyBank = new PiggyBank();

        deployedPiggyBanks.push(address(newPiggyBank));
        userPiggyBanks[msg.sender].push(address(newPiggyBank));

        emit PiggyBankCreated(address(newPiggyBank), msg.sender);

        return address(newPiggyBank);
    }

    function getDeployedPiggyBanks() external view returns (address[] memory) {
        return deployedPiggyBanks;
    }

    function getUserPiggyBanks(
        address user
    ) external view returns (address[] memory) {
        return userPiggyBanks[user];
    }

    function getDeployedPiggyBanksCount() external view returns (uint256) {
        return deployedPiggyBanks.length;
    }
}
