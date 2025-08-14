// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockVRFCoordinatorV2 {
    function requestRandomWords(
        bytes32,
        uint64,
        uint16,
        uint32,
        uint32
    ) external returns (uint256) {
        return 1; // Mock request ID
    }

    function fulfillRandomWords(uint256 requestId, address consumer) external {
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = uint256(keccak256(abi.encode(block.timestamp)));
        VRFConsumerBaseV2(consumer).fulfillRandomWords(requestId, randomWords);
    }
}

interface VRFConsumerBaseV2 {
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external;
}