// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract VRFCoordinatorV2Mock {
    event RandomWordsRequested(uint256 requestId);
    event RandomWordsFulfilled(uint256 requestId, uint256[] randomWords, bool success);

    mapping(uint256 => address) public s_requests;

    function requestRandomWords(
    ) external returns (uint256 requestId) {
        requestId = uint256(keccak256(abi.encodePacked(msg.sender, block.number)));
        s_requests[requestId] = msg.sender;
        emit RandomWordsRequested(requestId);
        return requestId;
    }

    function fulfillRandomWords(uint256 requestId, address consumer, uint256[] memory randomWords) external {
        (bool success, ) = consumer.call(abi.encodeWithSelector(0x3d2341ad, requestId, randomWords)); // rawFulfillRandomWords selector
        emit RandomWordsFulfilled(requestId, randomWords, success);
    }
}