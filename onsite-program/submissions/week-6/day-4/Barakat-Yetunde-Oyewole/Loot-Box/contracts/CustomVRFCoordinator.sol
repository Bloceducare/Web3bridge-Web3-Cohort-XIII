// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";

contract CustomVRFCoordinator is VRFCoordinatorV2Interface {
    uint256 private _requestIdCounter = 1;
    mapping(uint256 => address) private _requests;

    function requestRandomWords(
        bytes32,
        uint64,
        uint16,
        uint32,
        uint32
    ) external override returns (uint256 requestId) {
        requestId = _requestIdCounter++;
        _requests[requestId] = msg.sender;

        return requestId;
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) external {
        address consumer = _requests[requestId];
        require(consumer != address(0), "Invalid request ID");

        VRFConsumerBaseV2(consumer).rawFulfillRandomWords(
            requestId,
            randomWords
        );
        delete _requests[requestId];
    }

    function generateRandomNumber(
        uint256 seed
    ) external view returns (uint256) {
        return
            uint256(
                keccak256(
                    abi.encodePacked(block.timestamp, block.prevrandao, seed)
                )
            );
    }

    function getRequestConfig()
        external
        pure
        override
        returns (uint16, uint32, bytes32[] memory)
    {
        bytes32[] memory keyHashes = new bytes32[](1);
        keyHashes[
            0
        ] = 0x0000000000000000000000000000000000000000000000000000000000000000;
        return (3, 2500000, keyHashes);
    }

    function createSubscription() external pure override returns (uint64) {
        return 1;
    }

    function getSubscription(
        uint64
    )
        external
        pure
        override
        returns (uint96, uint64, address, address[] memory)
    {
        address[] memory consumers = new address[](0);
        return (0, 1, address(0), consumers);
    }

    function requestSubscriptionOwnerTransfer(
        uint64,
        address
    ) external pure override {}

    function acceptSubscriptionOwnerTransfer(uint64) external pure override {}

    function addConsumer(uint64, address) external pure override {}

    function removeConsumer(uint64, address) external pure override {}

    function cancelSubscription(uint64, address) external pure override {}

    function pendingRequestExists(
        uint64
    ) external pure override returns (bool) {
        return false;
    }
}