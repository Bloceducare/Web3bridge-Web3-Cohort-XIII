// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
interface IRNGConsumer {
    function onRandomnessReady(uint256 requestId, uint256 randomValue, address opener) external;
}

contract RandomNumberGenerator is VRFConsumerBaseV2 {
    struct Callback {
        address consumer; // contract to callback
        address opener;   // original user who opened
    }

    VRFCoordinatorV2Interface public vrfCoordinator;

    // Chainlink VRF configuration
    uint64 public subscriptionId;
    bytes32 public keyHash;
    uint32 public callbackGasLimit;
    uint16 public requestConfirmations;
    uint32 public numWords = 1;

    address public owner;

    // requestId => callback data
    mapping(uint256 => Callback) public callbacks;

    // optional consumer allowlist
    mapping(address => bool) public allowedConsumer;

    event RandomRequested(uint256 indexed requestId, address indexed consumer, address indexed opener);
    event RandomFulfilled(uint256 indexed requestId, address indexed consumer, address indexed opener, uint256 randomValue);
    event ConsumerAllowed(address indexed consumer, bool allowed);
    event ConfigUpdated(bytes32 keyHash, uint32 callbackGasLimit, uint16 requestConfirmations, uint32 numWords);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(
        address _vrfCoordinator,
        uint64 _subscriptionId,
        bytes32 _keyHash,
        uint32 _callbackGasLimit,
        uint16 _requestConfirmations
    ) VRFConsumerBaseV2(_vrfCoordinator) {
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        callbackGasLimit = _callbackGasLimit;
        requestConfirmations = _requestConfirmations;
        owner = msg.sender;
    }

    function setConsumerAllowed(address consumer, bool allowed) external onlyOwner {
        allowedConsumer[consumer] = allowed;
        emit ConsumerAllowed(consumer, allowed);
    }

    function setConfig(bytes32 _keyHash, uint32 _callbackGasLimit, uint16 _requestConfirmations, uint32 _numWords) external onlyOwner {
        keyHash = _keyHash;
        callbackGasLimit = _callbackGasLimit;
        requestConfirmations = _requestConfirmations;
        numWords = _numWords;
        emit ConfigUpdated(_keyHash, _callbackGasLimit, _requestConfirmations, _numWords);
    }

    // Called by consumer (e.g., LootBox). Consumer must be allowlisted.
    function requestRandom(address opener) external returns (uint256 requestId) {
//        require(allowedConsumer[msg.sender], "consumer not allowed");
        requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
        callbacks[requestId] = Callback({consumer: msg.sender, opener: opener});
        emit RandomRequested(requestId, msg.sender, opener);
    }

    // Chainlink VRF callback
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        Callback memory data = callbacks[requestId];
        require(data.consumer != address(0), "unknown requestId");
        delete callbacks[requestId];

        uint256 val = randomWords[0];
        emit RandomFulfilled(requestId, data.consumer, data.opener, val);

        // Callback to consumer
        IRNGConsumer(data.consumer).onRandomnessReady(requestId, val, data.opener);
    }
}