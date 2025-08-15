// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract VRFCoordinatorV2Mock {
    uint96 public constant MINIMUM_REQUEST_CONFIRMATIONS = 3;
    uint32 public constant CALLBACK_GAS_LIMIT = 100000;
    uint32 public constant NUM_WORDS = 1;

    event RandomWordsRequested(
        bytes32 keyHash,
        uint256 requestId,
        uint256 preSeed,
        uint64 subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords,
        address sender
    );

    event RandomWordsFulfilled(uint256 requestId, uint256[] randomWords, uint256 payment, bool success);

    mapping(uint256 => address) public s_requests;

    uint64 public s_currentSubId;

    function createSubscription() external returns (uint64 subId) {
        s_currentSubId++;
        subId = s_currentSubId;
    }

    function addConsumer(uint64 subId, address consumer) external {}

    function requestRandomWords(
        bytes32 keyHash,
        uint64 subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external returns (uint256 requestId) {
        requestId = uint256(keccak256(abi.encodePacked(msg.sender, block.number)));
        s_requests[requestId] = msg.sender;
        emit RandomWordsRequested(keyHash, requestId, 0, subId, minimumRequestConfirmations, callbackGasLimit, numWords, msg.sender);
        return requestId;
    }

    function fulfillRandomWords(uint256 requestId, address consumer, uint256[] memory randomWords) external {
        (bool success, ) = consumer.call(abi.encodeWithSelector(0x3d2341ad, requestId, randomWords)); // rawFulfillRandomWords selector
        uint256 payment = 0;
        emit RandomWordsFulfilled(requestId, randomWords, payment, success);
    }

    function fundSubscription(uint64 subId, uint96 amount) external payable {}
}