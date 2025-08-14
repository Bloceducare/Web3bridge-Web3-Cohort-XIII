// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockRNG {
    function mockCallback(address lootBox, uint256 randomNumber, address user) external {
        ILootBox(lootBox).onRandomnessReady(0, randomNumber, user);
    }
}

interface ILootBox {
    function onRandomnessReady(uint256 requestId, uint256 randomNumber, address user) external;
}