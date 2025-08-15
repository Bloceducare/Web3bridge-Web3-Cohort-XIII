// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

contract LootBox is VRFConsumerBaseV2Plus {
    enum RewardType { ERC20, ERC721, ERC1155 }

    struct Reward {
        RewardType rewardType;
        address tokenAddress;
        uint256 amountOrId; 
        uint256 weight;
    }

    Reward[] public rewards;
    uint256 public totalWeight;
    uint256 public boxFee;
    uint256 public s_subscriptionId;
    bytes32 public s_keyHash;
    uint32 public callbackGasLimit = 100000;
    uint16 public requestConfirmations = 3;

    mapping(uint256 => address) private s_requestToUser;

    event BoxOpened(address indexed user, uint256 indexed requestId);
    event RewardAssigned(address indexed user, uint256 rewardIndex, RewardType rewardType, address tokenAddress, uint256 amountOrId);
    event RandomnessFulfilled(uint256 indexed requestId, uint256 randomWord);
    event RewardAdded(uint256 index, RewardType rewardType, address tokenAddress, uint256 amountOrId, uint256 weight);
    event FeeUpdated(uint256 newFee);
    event SubscriptionUpdated(uint256 newSubscriptionId);
    event KeyHashUpdated(bytes32 newKeyHash);

    constructor(
        address vrfCoordinator,
        bytes32 keyHash,
        uint256 subscriptionId,
        uint256 _boxFee
    ) VRFConsumerBaseV2Plus(vrfCoordinator) {
        s_keyHash = keyHash;
        s_subscriptionId = subscriptionId;
        boxFee = _boxFee;
    }

    function addReward(RewardType _type, address _tokenAddress, uint256 _amountOrId, uint256 _weight) external onlyOwner {
        require(_weight > 0, "Weight must be positive");
        rewards.push(Reward({
            rewardType: _type,
            tokenAddress: _tokenAddress,
            amountOrId: _amountOrId,
            weight: _weight
        }));

        totalWeight += _weight;
        emit RewardAdded(rewards.length - 1, _type, _tokenAddress, _amountOrId, _weight);
    }

    function updateFee(uint256 _newFee) external onlyOwner {
        boxFee = _newFee;
        emit FeeUpdated(_newFee);
    }

    function updateSubscriptionId(uint256 _newSubscriptionId) external onlyOwner {
        s_subscriptionId = _newSubscriptionId;
        emit SubscriptionUpdated(_newSubscriptionId);
    }

    function updateKeyHash(bytes32 _newKeyHash) external onlyOwner {
        s_keyHash = _newKeyHash;
        emit KeyHashUpdated(_newKeyHash);
    }

    function openBox() external payable {
        require(msg.value == boxFee, "Incorrect fee");
        require(totalWeight > 0, "No rewards set");
        uint256 requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: s_keyHash,
                subId: s_subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: 1,
                extraArgs: VRFV2PlusClient._argsToBytes(VRFV2PlusClient.ExtraArgsV1({nativePayment: false}))
            })
        );
        
        s_requestToUser[requestId] = msg.sender;
        emit BoxOpened(msg.sender, requestId);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override {
        address user = s_requestToUser[requestId];
        require(user != address(0), "Invalid request");
        uint256 random = randomWords[0] % totalWeight;
        uint256 cumulative = 0;
        uint256 selectedIndex = type(uint256).max;

        for (uint256 i = 0; i < rewards.length; i++) {
            cumulative += rewards[i].weight;
            if (random < cumulative) {
                selectedIndex = i;
                break;
            }
        }

        require(selectedIndex != type(uint256).max, "No reward selected");

        Reward memory selectedReward = rewards[selectedIndex];
        emit RewardAssigned(user, selectedIndex, selectedReward.rewardType, selectedReward.tokenAddress, selectedReward.amountOrId);
        emit RandomnessFulfilled(requestId, randomWords[0]);

        if (selectedReward.rewardType == RewardType.ERC20) {
            IERC20(selectedReward.tokenAddress).transfer(user, selectedReward.amountOrId);
        } else if (selectedReward.rewardType == RewardType.ERC721) {
            IERC721(selectedReward.tokenAddress).transferFrom(address(this), user, selectedReward.amountOrId);
        } else if (selectedReward.rewardType == RewardType.ERC1155) {
            IERC1155(selectedReward.tokenAddress).safeTransferFrom(address(this), user, selectedReward.amountOrId, 1, "");
        }

        delete s_requestToUser[requestId];
    }

   
    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}