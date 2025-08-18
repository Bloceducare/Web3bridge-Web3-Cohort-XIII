// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IVRFCoordinatorV2 (minimal interface)
 * @dev Enough surface for requestRandomWords + internal accounting for subscription-based VRF.
 */
interface IVRFCoordinatorV2 {
    function requestRandomWords(
        bytes32 keyHash,
        uint64  subId,
        uint16  requestConfirmations,
        uint32  callbackGasLimit,
        uint32  numWords
    ) external returns (uint256 requestId);
}
