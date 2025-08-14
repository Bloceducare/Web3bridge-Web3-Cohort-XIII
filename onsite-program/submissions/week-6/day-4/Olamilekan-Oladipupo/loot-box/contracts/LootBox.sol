// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./RandomNumberGenerator.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

contract LootBox is IRNGConsumer {
    enum RewardType { ERC20, ERC721, ERC1155 }
    struct Reward {
        RewardType rewardType;
        address token;
        uint256 tokenIdOrAmount;
        uint256 weight;
    }

    Reward[] public rewards;
    uint256 public totalWeight;
    uint256 public openFee;
    RandomNumberGenerator public rng;
    address public owner;

    event BoxOpened(address indexed opener, uint256 indexed requestId);
    event RandomFulfilled(uint256 indexed requestId, uint256 randomVal);
    event RewardDistributed(address indexed winner, RewardType rewardType, address indexed token, uint256 tokenIdOrAmount);
    event RewardAdded(uint256 index, RewardType rewardType, address token, uint256 tokenIdOrAmount, uint256 weight);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _rng, uint256 _openFee) {
        rng = RandomNumberGenerator(_rng);
        owner = msg.sender;
        openFee = _openFee;
    }

    // Add a reward (admin)
    function addReward(RewardType rewardType, address token, uint256 tokenIdOrAmount, uint256 weight) external onlyOwner {
        require(weight > 0, "weight=0");
        rewards.push(Reward(rewardType, token, tokenIdOrAmount, weight));
        totalWeight += weight;
        emit RewardAdded(rewards.length - 1, rewardType, token, tokenIdOrAmount, weight);
    }

    // Open a box: user pays fee, RNG is requested
    function openBox() external payable returns (uint256) {
        require(msg.value == openFee, "fee error");
        uint256 requestId = rng.requestRandom(msg.sender);
        emit BoxOpened(msg.sender, requestId);
        return requestId;
    }

    // RNG callback entrypoint
    function onRandomnessReady(uint256 requestId, uint256 randomValue, address opener) external override {
        require(msg.sender == address(rng), "not rng");
        emit RandomFulfilled(requestId, randomValue);
        _distributeReward(opener, randomValue);
    }

    // Weighted reward selection & distribution
    function _distributeReward(address winner, uint256 randomVal) internal {
        uint256 roll = randomVal % totalWeight;
        uint256 s = 0;
        for (uint256 i = 0; i < rewards.length; ++i) {
            s += rewards[i].weight;
            if (roll < s) {
                Reward memory r = rewards[i];
                if (r.rewardType == RewardType.ERC20) {
                    IERC20(r.token).transfer(winner, r.tokenIdOrAmount);
                } else if (r.rewardType == RewardType.ERC721) {
                    IERC721(r.token).safeTransferFrom(address(this), winner, r.tokenIdOrAmount);
                } else if (r.rewardType == RewardType.ERC1155) {
                    IERC1155(r.token).safeTransferFrom(address(this), winner, r.tokenIdOrAmount, 1, "");
                }
                emit RewardDistributed(winner, r.rewardType, r.token, r.tokenIdOrAmount);
                return;
            }
        }
        revert("Reward: unreachable");
    }

    // Owner can withdraw funds
    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}