// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockVRFCoordinator
 * @dev Mock VRF Coordinator for testing purposes
 */
contract MockVRFCoordinator {
    uint256 private _requestIdCounter = 1;
    
    mapping(uint256 => address) private _requestIdToConsumer;
    mapping(uint256 => bool) private _requestFulfilled;
    
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

    function requestRandomWords(
        bytes32 keyHash,
        uint64 subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external returns (uint256 requestId) {
        requestId = _requestIdCounter++;
        _requestIdToConsumer[requestId] = msg.sender;
        
        emit RandomWordsRequested(
            keyHash,
            requestId,
            uint256(keccak256(abi.encode(requestId, block.timestamp))),
            subId,
            minimumRequestConfirmations,
            callbackGasLimit,
            numWords,
            msg.sender
        );
        
        return requestId;
    }
    
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external {
        address consumer = _requestIdToConsumer[requestId];
        require(consumer != address(0), "MockVRF: Invalid request ID");
        require(!_requestFulfilled[requestId], "MockVRF: Request already fulfilled");
        
        _requestFulfilled[requestId] = true;
        
        (bool success, ) = consumer.call(
            abi.encodeWithSignature("rawFulfillRandomWords(uint256,uint256[])", requestId, randomWords)
        );
        
        emit RandomWordsFulfilled(requestId, randomWords[0], 0, success);
        
        if (!success) {
            // Reset if callback failed
            _requestFulfilled[requestId] = false;
        }
    }
    
    function fulfillRandomWordsWithSeed(uint256 requestId, uint256 seed) external {
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = uint256(keccak256(abi.encode(seed, block.timestamp, block.difficulty)));
        fulfillRandomWords(requestId, randomWords);
    }
    
    function getRequestStatus(uint256 requestId) external view returns (bool fulfilled, address consumer) {
        return (_requestFulfilled[requestId], _requestIdToConsumer[requestId]);
    }
}
