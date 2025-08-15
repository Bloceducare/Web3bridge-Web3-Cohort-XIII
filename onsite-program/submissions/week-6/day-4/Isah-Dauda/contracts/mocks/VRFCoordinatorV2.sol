// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IVRFCoordinatorV2.sol";


contract VRFCoordinatorV2 is IVRFCoordinatorV2 {
    uint256 private _nextRequestId = 1;

    event RandomWordsRequested(uint256 indexed requestId, address indexed requester);
    event RandomWordsFulfilled(uint256 indexed requestId, address indexed requester);

    struct Request {
        address requester;
        bytes32 keyHash;
        uint64 subId;
        uint16 confirmations;
        uint32 callbackGasLimit;
        uint32 numWords;
    }

    mapping(uint256 => Request) public requests;

    function requestRandomWords(
        bytes32 keyHash,
        uint64  subId,
        uint16  requestConfirmations,
        uint32  callbackGasLimit,
        uint32  numWords
    ) external override returns (uint256 requestId) {
        requestId = _nextRequestId++;
        requests[requestId] = Request({
            requester: msg.sender,
            keyHash: keyHash,
            subId: subId,
            confirmations: requestConfirmations,
            callbackGasLimit: callbackGasLimit,
            numWords: numWords
        });
        emit RandomWordsRequested(requestId, msg.sender);
    }


    function fulfill(address consumer, uint256 requestId, uint256[] calldata randomWords) external {
        
        (bool ok,) = consumer.call(abi.encodeWithSignature("rawFulfillRandomWords(uint256,uint256[])", requestId, randomWords));
        require(ok, "fulfill failed");
        emit RandomWordsFulfilled(requestId, requests[requestId].requester);
        delete requests[requestId];
    }
}
