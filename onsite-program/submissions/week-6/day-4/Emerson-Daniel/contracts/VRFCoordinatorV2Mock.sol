// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";

/**
 * @title VRFCoordinatorV2Mock
 * @dev Mock contract for testing Chainlink VRF functionality
 */
contract VRFCoordinatorV2Mock is VRFCoordinatorV2Interface {
    uint256 private constant MOCK_VRF_COORDINATOR_BASE_FEE = 0.25 ether;
    uint256 private constant MOCK_VRF_COORDINATOR_GAS_PRICE_LINK = 1e9;

    uint256 private s_requestCounter = 1;
    uint256 private s_subscriptionCounter = 1;
    
    mapping(uint256 => address) private s_requestIdToConsumer;
    mapping(uint64 => Subscription) private s_subscriptions;
    mapping(uint64 => mapping(address => bool)) private s_consumers;

    struct Subscription {
        uint96 balance;
        uint64 reqCount;
        address owner;
        address[] consumers;
    }

    event RandomWordsRequested(
        bytes32 indexed keyHash,
        uint256 requestId,
        uint256 preSeed,
        uint64 indexed subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords,
        address indexed sender
    );

    event RandomWordsFulfilled(uint256 indexed requestId, uint256 outputSeed, uint96 payment, bool success);

    constructor(uint96 _baseFee, uint96 _gasPriceLink) {}

    function requestRandomWords(
        bytes32 keyHash,
        uint64 subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external override returns (uint256) {
        require(s_subscriptions[subId].owner != address(0), "Subscription not found");
        require(s_consumers[subId][msg.sender], "Consumer not authorized");

        uint256 requestId = s_requestCounter;
        s_requestCounter++;
        s_requestIdToConsumer[requestId] = msg.sender;

        emit RandomWordsRequested(
            keyHash,
            requestId,
            0, // preSeed
            subId,
            minimumRequestConfirmations,
            callbackGasLimit,
            numWords,
            msg.sender
        );

        return requestId;
    }

    function fulfillRandomWords(uint256 requestId, address consumer) external {
        require(s_requestIdToConsumer[requestId] != address(0), "Request not found");
        
        // Generate mock random words
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty, requestId)));

        VRFConsumerBaseV2(consumer).rawFulfillRandomWords(requestId, randomWords);
        
        delete s_requestIdToConsumer[requestId];
        
        emit RandomWordsFulfilled(requestId, randomWords[0], 0, true);
    }

    function createSubscription() external override returns (uint64) {
        uint64 subId = s_subscriptionCounter;
        s_subscriptionCounter++;
        
        s_subscriptions[subId] = Subscription({
            balance: 0,
            reqCount: 0,
            owner: msg.sender,
            consumers: new address[](0)
        });
        
        return subId;
    }

    function getSubscription(uint64 subId) external view override returns (
        uint96 balance,
        uint64 reqCount,
        address owner,
        address[] memory consumers
    ) {
        Subscription memory sub = s_subscriptions[subId];
        return (sub.balance, sub.reqCount, sub.owner, sub.consumers);
    }

    function requestSubscriptionOwnerTransfer(uint64, address) external pure override {
        revert("Not implemented in mock");
    }

    function acceptSubscriptionOwnerTransfer(uint64) external pure override {
        revert("Not implemented in mock");
    }

    function addConsumer(uint64 subId, address consumer) external override {
        require(s_subscriptions[subId].owner == msg.sender, "Not subscription owner");
        s_consumers[subId][consumer] = true;
        s_subscriptions[subId].consumers.push(consumer);
    }

    function removeConsumer(uint64 subId, address consumer) external override {
        require(s_subscriptions[subId].owner == msg.sender, "Not subscription owner");
        s_consumers[subId][consumer] = false;
        
        // Remove from consumers array
        address[] storage consumers = s_subscriptions[subId].consumers;
        for (uint256 i = 0; i < consumers.length; i++) {
            if (consumers[i] == consumer) {
                consumers[i] = consumers[consumers.length - 1];
                consumers.pop();
                break;
            }
        }
    }

    function cancelSubscription(uint64, address) external pure override {
        revert("Not implemented in mock");
    }

    function pendingRequestExists(uint64) external pure override returns (bool) {
        return false;
    }

    // Helper function for testing
    function fulfillRandomWordsWithOverride(
        uint256 requestId, 
        address consumer, 
        uint256[] memory randomWords
    ) external {
        require(s_requestIdToConsumer[requestId] != address(0), "Request not found");
        
        VRFConsumerBaseV2(consumer).rawFulfillRandomWords(requestId, randomWords);
        
        delete s_requestIdToConsumer[requestId];
        
        emit RandomWordsFulfilled(requestId, randomWords[0], 0, true);
    }
}
