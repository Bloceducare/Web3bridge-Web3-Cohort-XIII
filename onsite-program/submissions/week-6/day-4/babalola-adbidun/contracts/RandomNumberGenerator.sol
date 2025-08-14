// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";

contract RandomNumberGenerator is VRFConsumerBaseV2 {
    VRFCoordinatorV2Interface COORDINATOR;
    
    uint64 s_subscriptionId;
    bytes32 keyHash;
    uint32 callbackGasLimit = 100000;
    uint16 requestConfirmations = 3;
    uint256 public randomResult;

    constructor(uint64 subscriptionId, address vrfCoordinator) VRFConsumerBaseV2(vrfCoordinator) {
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        s_subscriptionId = subscriptionId;
        keyHash = keccak256("76025552955773742409598247589851646688819278531780743956534831031639761126863");
    }
    event RequestRandomNumber(uint256);

    function requestRandomNumber() external returns (uint256 requestId) {
        requestId = COORDINATOR.requestRandomWords(keyHash,s_subscriptionId,requestConfirmations,callbackGasLimit,1);
        emit RequestRandomNumber(requestId);
    }

    function fulfillRandomWords(uint256, uint256[] memory randomWords) internal override {
        randomResult = randomWords[0];
    }
}
//vrfCo-ordinator : 0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B
// subscription id : 76025552955773742409598247589851646688819278531780743956534831031639761126863
// key hash : 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae
// 