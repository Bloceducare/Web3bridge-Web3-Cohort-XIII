// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {PiggyBank} from "./PiggyBank.sol";

contract PiggyBAnkFactory {
    address public deployer;
    PiggyBank[] public piggyBanks;

    constructor() {
        deployer = msg.sender;
    }

    function createPiggyBank() external {
        PiggyBank newBank = new PiggyBank();
        piggyBanks.push(newBank);
    }

    function getAllPiggyBanks() external view returns (PiggyBank[] memory) {
        return piggyBanks;
    }
}