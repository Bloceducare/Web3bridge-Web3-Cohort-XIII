// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

// import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
// import "@chainlink/contracts/src/v0.8/vrf/dev/VRFCoordinatorV2_5.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/VRFCoordinatorV2_5.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/VRFV2PlusWrapperConsumerBase.sol";
// import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";

contract RandomNumberGenerator is VRFV2PlusWrapperConsumerBase {
    VRFCoordinatorV2_5 COORDINATOR;
    
    uint256 s_subscriptionId;
    bytes32 keyHash;
    uint32 callbackGasLimit = 100000;
    uint16 requestConfirmations = 3;
    uint256 public randomResult;

    constructor(address vrfCoordinator) VRFV2PlusWrapperConsumerBase(vrfCoordinator) {
        COORDINATOR = VRFCoordinatorV2_5(vrfCoordinator);
        s_subscriptionId = 76025552955773742409598247589851646688819278531780743956534831031639761126863;
        keyHash = 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;
    }
    event RequestRandomNumber(uint256);

    function requestRandomNumber() external returns (uint256 requestId) {
        requestId = COORDINATOR.requestRandomWords(VRFV2PlusClient.RandomWordsRequest(keyHash,s_subscriptionId,requestConfirmations,callbackGasLimit,1,
        VRFV2PlusClient._argsToBytes(VRFV2PlusClient.ExtraArgsV1({nativePayment: false}))));
        emit RequestRandomNumber(requestId);
    }

    function fulfillRandomWords(uint256, uint256[] memory randomWords) internal override {
        randomResult = randomWords[0];
    }

    function getRandomResult()external view returns (uint){
        return randomResult;
    }
}
//vrfCo-ordinator : 0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625
// subscription id : 
// key hash : 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae
//
//29254301773979501719982858792614107486112618570245619512122305011679505225659
// dirct funding 0xA8A278BF534BCa72eFd6e6C9ac573E98c21A6171