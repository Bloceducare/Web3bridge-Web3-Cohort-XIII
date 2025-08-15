// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockRNG {

    struct Callback {
        address consumer;
        address opener;
    }



    mapping(uint256 => Callback) public callbacks;

    event RandomRequested(uint256 indexed requestId, address indexed consumer, address indexed opener);


    function mockCallback(address lootBox, uint256 randomNumber, address user) external {
        ILootBox(lootBox).onRandomnessReady(0, randomNumber, user);
    }


    function requestRandom(address opener) external returns (uint256 requestId) {
        callbacks[requestId] = Callback({consumer: msg.sender, opener: opener});
        emit RandomRequested(requestId, msg.sender, opener);
    }
}

interface ILootBox {
    function onRandomnessReady(uint256 requestId, uint256 randomNumber, address user) external;
}