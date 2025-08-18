// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

library Data {

    enum RewardType {NoItem, ERC20, ERC721, ERC1155 }

    struct Rewards {
        uint256 rewardId;
        uint256 weight;
        RewardType reward_type;
        address tokenAddress;
        uint256 tokenId;
        uint256 amount;
    }

    struct Users {
        uint userId;
        uint256 userBalance;
        uint256 randNumber;
    }

    error Not_authorized();
    error Invalid_token_address();
    error Invalid_Reward_Count();
    error Weight_Must_Be_Greater_Than_0();
    error Weight_Must_Be_Less_Than_100();
    error INVALID_WEIGHT();
    error InvalidAccountId();
    error NoZeroDeposit();
    error AmountMismatch();
    error Insufficient_Funds();
    error You_dont_own_this_item();
    error Only_Owner_Can_Perform_This_Action();
    error Invalid_reward_parameters();

    event RewardAdded(uint256 weight, RewardType reward_type, uint256 amount);
    event RewardsHistory(uint256 weightsToProcess, uint256 counter);
    event Deposited(address _address, uint256 value);
    event LootBoxFeeChanged(address _address, uint256 newFee);
    event RewardDistributed(address _to, uint256 amount);
    event RewardDistributedNft(address _to, uint256 amount, uint256 tokenId);
    event RewardDistributed1155(address _to, uint256 amount, uint256 tokenId);
    event LootBoxCreated(address _address, address indexed user);


}