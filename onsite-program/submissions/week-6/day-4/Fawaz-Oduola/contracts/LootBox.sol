// SPDX-License-Identifier: MIT
// An example of a consumer contract that relies on a subscription for funding.
pragma solidity 0.8.28;

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

contract SubscriptionConsumer is VRFConsumerBaseV2Plus {
    event RequestSent(uint256 requestId, uint32 numWords);
    event RequestFulfilled(uint256 requestId, uint256[] randomWords);
    event WonERC20(address winner);
    event WonERC721(address winner);
    event WonERC1155(address winner);

    address immutable OWNER;

    struct RequestStatus {
        bool fulfilled; 
        bool exists; 
        uint256[] randomWords;
    }
    mapping(uint256 => RequestStatus)
        public s_requests; /* requestId --> requestStatus */

    mapping(uint256=>address) randomWordsRequester;
    enum Reward {
        ERC20,
        ERC721,
        ERC1155
    }
    Reward[] private rewards = [Reward.ERC20, Reward.ERC721, Reward.ERC1155];
    mapping(Reward => uint256) RewardWeight;
    uint256 immutable TOTAL_WEIGHT;



    // Your subscription ID.
    uint256 public s_subscriptionId;

    // Past request IDs.
    uint256[] public requestIds;
    uint256 public lastRequestId;


    bytes32 public keyHash =
        0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;

   
    uint32 public callbackGasLimit = 200000;

    // The default is 3, but you can set this higher.
    uint16 public requestConfirmations = 3;

    // For this example, retrieve 2 random values in one request.
    // Cannot exceed VRFCoordinatorV2_5.MAX_NUM_WORDS.
    uint32 public numWords = 1;

    /**
     * HARDCODED FOR SEPOLIA
     * COORDINATOR: 0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B
     */
    constructor(
        uint256 subscriptionId,uint256 weightERC20, uint256 weightERC721, uint256 weightERC1155
    ) VRFConsumerBaseV2Plus(0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B) {
        s_subscriptionId = subscriptionId;

        RewardWeight[Reward.ERC20] = weightERC20;
        RewardWeight[Reward.ERC721] = weightERC721;
        RewardWeight[Reward.ERC1155] = weightERC1155;

        TOTAL_WEIGHT =
            RewardWeight[Reward.ERC20] +
            RewardWeight[Reward.ERC721] +
            RewardWeight[Reward.ERC1155];
        
        OWNER = msg.sender;
    }

    function withdraw() external {
        
        payable(OWNER).transfer(address(this).balance);
    }


     function openBox() external payable {
        require(msg.value <1e16, "don't pay more than 0.1ETH");

        requestRandomWords(true, msg.sender);
    }

    function getReward(uint256 random) external  returns (string memory){
      return _pickWeightedRandom(random, msg.sender); //for testing only
    }

    function _pickWeightedRandom(uint256 random, address winner) internal returns (string memory reward) {
      
      random = random % TOTAL_WEIGHT;
      for (uint256 i; i < rewards.length; i++) {
    if (random <= RewardWeight[rewards[i]]) {
        if (rewards[i] == Reward.ERC20) {
            emit WonERC20(winner);
            return "ERC20";
        }
        if (rewards[i] == Reward.ERC721) {
            emit WonERC721(winner);
            return "ERC721";
        }
        if (rewards[i] == Reward.ERC1155) {
            emit WonERC1155(winner);
            return "ERC1155";
        }
        return "None";
    } else {
        unchecked {
            random = random - RewardWeight[rewards[i]];
        }
    }
}

    }


    // Assumes the subscription is funded sufficiently.
    // @param enableNativePayment: Set to `true` to enable payment in native tokens, or
    // `false` to pay in LINK
    function requestRandomWords(
        bool enableNativePayment, address sender
    ) internal returns (uint256 requestId) {
        // Will revert if subscription is not set and funded.
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: s_subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({
                        nativePayment: enableNativePayment
                    })
                )
            })
        );
        s_requests[requestId] = RequestStatus({
            randomWords: new uint256[](0),
            exists: true,
            fulfilled: false
        });
        requestIds.push(requestId);
        lastRequestId = requestId;
        emit RequestSent(requestId, numWords);
        randomWordsRequester[requestId] = sender;
        return requestId;
    }

    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] calldata _randomWords
    ) internal override {
        require(s_requests[_requestId].exists, "request not found");
        s_requests[_requestId].fulfilled = true;
        s_requests[_requestId].randomWords = _randomWords;
        emit RequestFulfilled(_requestId, _randomWords);
        // _pickWeightedRandom(_randomWords[0], randomWordsRequester[_requestId]);

    }

    function getRequestStatus(
        uint256 _requestId
    ) external view returns (bool fulfilled, uint256[] memory randomWords) {
        require(s_requests[_requestId].exists, "request not found");
        RequestStatus memory request = s_requests[_requestId];
        return (request.fulfilled, request.randomWords);
    }
}
