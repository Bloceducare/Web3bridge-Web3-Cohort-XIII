// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";

contract LootBox is Ownable, VRFConsumerBaseV2 {
    enum RewardType { ERC20, ERC721, ERC1155 }

    struct Reward {
        RewardType rewardType;
        address tokenAddress;
        uint256 amountOrId;
        uint256 weight;
    }

    uint256 public boxFee;
    Reward[] public rewards;
    uint256 public totalWeight;

    VRFCoordinatorV2Interface public vrfCoordinator;
    bytes32 public keyHash;
    uint64 public subscriptionId;
    uint32 public callbackGasLimit = 100000;
    uint16 public requestConfirmations = 3;
    uint32 public numWords = 1;

    mapping(uint256 => address) public requestToUser;

    event BoxOpened(address indexed user, uint256 requestId);
    event RandomnessRequested(uint256 requestId);
    event RewardDistributed(address indexed user, RewardType rewardType, address tokenAddress, uint256 amountOrId);
    event FeeUpdated(uint256 newFee);
    event RewardAdded(RewardType rewardType, address tokenAddress, uint256 amountOrId, uint256 weight);

    constructor(
        uint256 _boxFee,
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint64 _subscriptionId
    ) Ownable(msg.sender) VRFConsumerBaseV2(_vrfCoordinator) {
        boxFee = _boxFee;
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        keyHash = _keyHash;
        subscriptionId = _subscriptionId;
    }

    function addReward(RewardType _type, address _tokenAddress, uint256 _amountOrId, uint256 _weight) external onlyOwner {
        rewards.push(Reward(_type, _tokenAddress, _amountOrId, _weight));
        totalWeight += _weight;
        emit RewardAdded(_type, _tokenAddress, _amountOrId, _weight);
    }

    function setBoxFee(uint256 _newFee) external onlyOwner {
        boxFee = _newFee;
        emit FeeUpdated(_newFee);
    }

    function openBox() external payable {
        require(msg.value == boxFee, "Incorrect fee");
        uint256 requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
        requestToUser[requestId] = msg.sender;
        emit BoxOpened(msg.sender, requestId);
        emit RandomnessRequested(requestId);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address user = requestToUser[requestId];
        require(user != address(0), "Request not found");
        uint256 randomNumber = randomWords[0];

        uint256 weightedRandom = randomNumber % totalWeight;
        uint256 cumulativeWeight = 0;
        Reward memory selectedReward;

        for (uint256 i = 0; i < rewards.length; i++) {
            cumulativeWeight += rewards[i].weight;
            if (weightedRandom < cumulativeWeight) {
                selectedReward = rewards[i];
                break;
            }
        }

        distributeReward(user, selectedReward);

        delete requestToUser[requestId];
    }

    function distributeReward(address user, Reward memory reward) internal {
        if (reward.rewardType == RewardType.ERC20) {
            IERC20(reward.tokenAddress).transfer(user, reward.amountOrId);
        } else if (reward.rewardType == RewardType.ERC721) {
            IERC721(reward.tokenAddress).safeTransferFrom(address(this), user, reward.amountOrId);
        } else if (reward.rewardType == RewardType.ERC1155) {
            IERC1155(reward.tokenAddress).safeTransferFrom(address(this), user, reward.amountOrId, 1, "");
        }
        emit RewardDistributed(user, reward.rewardType, reward.tokenAddress, reward.amountOrId);
    }

    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}