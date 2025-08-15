// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ILootBox {
    enum RewardType { ERC20, ERC721, ERC1155 }

    struct Reward {
        RewardType rewardType;
        address contractAddr;
        uint256 id; // For ERC721/ERC1155
        uint256 amount;
        uint256 weight;
    }

    event BoxOpened(address indexed user, uint256 requestId);
    event RandomnessRequested(uint256 requestId);
    event RandomnessFulfilled(uint256 requestId, uint256 randomWord);
    event RewardClaimed(address indexed user, RewardType rewardType, address contractAddr, uint256 id, uint256 amount);

    function openBox() external payable;
    function getRewards() external view returns (Reward[] memory);
    function getTotalWeight() external view returns (uint256);
}