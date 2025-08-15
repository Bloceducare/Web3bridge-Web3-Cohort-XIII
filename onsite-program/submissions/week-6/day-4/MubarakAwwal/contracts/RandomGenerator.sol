// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract RandomGenerator {
    uint256 private counter;
    mapping(uint256 => uint256) private results;

    event RandomRequested(uint256 requestId);
    event RandomGenerated(uint256 requestId, uint256 randomValue);

    function requestRandomWords() external returns (uint256) {
        counter++;
        uint256 requestId = counter;

        // Generate a pseudo-random value
        uint256 randomValue = uint256(
            keccak256(
                abi.encodePacked(block.timestamp, block.prevrandao, msg.sender, requestId)
            )
        );

        results[requestId] = randomValue;
        emit RandomRequested(requestId);
        emit RandomGenerated(requestId, randomValue);
        return requestId;
    }

    function getRandomWords(uint256 requestId) external view returns (uint256) {
        require(results[requestId] != 0, "No random value for this request");
        return results[requestId];
    }
}
