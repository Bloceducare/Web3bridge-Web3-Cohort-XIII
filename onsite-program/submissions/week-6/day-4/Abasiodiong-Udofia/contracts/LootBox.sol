// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "./interfaces/ILootBox.sol";
import "./libraries/Errors.sol";

abstract contract LootBox is VRFConsumerBaseV2, ILootBox {
    address public immutable admin;
    uint256 public fee;
    Reward[] public rewards;
    uint256 public totalWeight;
    mapping(uint256 => address) public pendingRequests;

    VRFCoordinatorV2Interface immutable COORDINATOR;
    uint64 immutable subscriptionId;
    bytes32 immutable keyHash;

    constructor(
        address vrfCoordinator,
        uint64 _subscriptionId,
        bytes32 _keyHash,
        uint256 _fee
    ) VRFConsumerBaseV2(vrfCoordinator) {
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        fee = _fee;
        admin = msg.sender;
    }

    function setFee(uint256 _fee) external {
        if (msg.sender != admin) revert Errors.OnlyAdmin();
        fee = _fee;
    }

    function addReward(Reward memory reward) external {
        if (msg.sender != admin) revert Errors.OnlyAdmin();
        if (reward.weight == 0) revert Errors.ZeroWeight();
        rewards.push(reward);
        totalWeight += reward.weight;
    }

    function removeReward(uint256 index) external {
        if (msg.sender != admin) revert Errors.OnlyAdmin();
        if (index >= rewards.length) revert Errors.InvalidIndex();
        totalWeight -= rewards[index].weight;
        rewards[index] = rewards[rewards.length - 1];
        rewards.pop();
    }

    function openBox() external payable {
        if (msg.value < fee) revert Errors.InsufficientFee(fee, msg.value);
        if (totalWeight == 0) revert Errors.NoRewardsSet();

        uint256 requestId = COORDINATOR.requestRandomWords(
            keyHash,
            subscriptionId,
            3,
            200000,
            1
        );

        pendingRequests[requestId] = msg.sender;
        emit BoxOpened(msg.sender, requestId);
        emit RandomnessRequested(requestId);
    }

    function rawFulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external override {
        address user = pendingRequests[requestId];
        delete pendingRequests[requestId];

        if (user == address(0)) revert Errors.InvalidRandomness();

        uint256 random = randomWords[0] % totalWeight;
        uint256 cumulativeWeight = 0;
        uint256 selectedIndex;
        for (uint256 i = 0; i < rewards.length; i++) {
            cumulativeWeight += rewards[i].weight;
            if (random < cumulativeWeight) {
                selectedIndex = i;
                break;
            }
        }

        Reward memory reward = rewards[selectedIndex];
        if (reward.rewardType == RewardType.ERC20) {
            IERC20(reward.contractAddr).transfer(user, reward.amount);
        } else if (reward.rewardType == RewardType.ERC721) {
            IERC721(reward.contractAddr).transferFrom(address(this), user, reward.id);
        } else if (reward.rewardType == RewardType.ERC1155) {
            IERC1155(reward.contractAddr).safeTransferFrom(address(this), user, reward.id, reward.amount, "");
        }

        emit RandomnessFulfilled(requestId, randomWords[0]);
        emit RewardClaimed(user, reward.rewardType, reward.contractAddr, reward.id, reward.amount);
    }

    function getRewards() external view override returns (Reward[] memory) {
        return rewards;
    }

    function getTotalWeight() external view override returns (uint256) {
        return totalWeight;
    }
}