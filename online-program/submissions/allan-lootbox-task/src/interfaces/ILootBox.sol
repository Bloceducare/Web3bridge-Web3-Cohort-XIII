// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ILootBox
 * @dev Interface for the LootBox contract defining all external functions and events
 */
interface ILootBox {
    /**
     * @dev Enum representing different reward types
     */
    enum RewardType {
        ERC20,
        ERC721,
        ERC1155
    }

    /**
     * @dev Enum representing different rarity levels
     */
    enum Rarity {
        COMMON,     // 50% chance
        UNCOMMON,   // 30% chance
        RARE,       // 15% chance
        EPIC,       // 4% chance
        LEGENDARY   // 1% chance
    }

    /**
     * @dev Struct representing a reward configuration
     */
    struct RewardConfig {
        RewardType rewardType;
        address contractAddress;
        uint256 tokenId;        // For ERC721/ERC1155, ignored for ERC20
        uint256 amount;         // Amount for ERC20/ERC1155, ignored for ERC721
        Rarity rarity;
        bool isActive;
    }

    /**
     * @dev Struct representing a loot box purchase request
     */
    struct LootBoxRequest {
        address requester;
        uint256 boxPrice;
        uint256 timestamp;
        bool fulfilled;
    }

    /**
     * @dev Events
     */
    event LootBoxPurchased(
        address indexed buyer,
        uint256 indexed requestId,
        uint256 price,
        uint256 timestamp
    );

    event LootBoxOpened(
        address indexed buyer,
        uint256 indexed requestId,
        uint256 rewardId,
        RewardType rewardType,
        address contractAddress,
        uint256 tokenId,
        uint256 amount,
        Rarity rarity
    );

    event RewardAdded(
        uint256 indexed rewardId,
        RewardType rewardType,
        address contractAddress,
        uint256 tokenId,
        uint256 amount,
        Rarity rarity
    );

    event RewardUpdated(
        uint256 indexed rewardId,
        bool isActive
    );

    event BoxPriceUpdated(
        uint256 oldPrice,
        uint256 newPrice
    );

    event VRFConfigUpdated(
        bytes32 keyHash,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint16 requestConfirmations
    );

    /**
     * @dev External functions
     */
    function purchaseLootBox() external payable returns (uint256 requestId);
    
    function addReward(
        RewardType rewardType,
        address contractAddress,
        uint256 tokenId,
        uint256 amount,
        Rarity rarity
    ) external returns (uint256 rewardId);
    
    function updateReward(uint256 rewardId, bool isActive) external;
    
    function setBoxPrice(uint256 newPrice) external;
    
    function updateVRFConfig(
        bytes32 keyHash,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint16 requestConfirmations
    ) external;
    
    function withdrawFunds() external;
    
    function emergencyWithdraw(address token, uint256 amount) external;
    
    /**
     * @dev View functions
     */
    function getBoxPrice() external view returns (uint256);
    
    function getReward(uint256 rewardId) external view returns (RewardConfig memory);
    
    function getActiveRewardsByRarity(Rarity rarity) external view returns (uint256[] memory);
    
    function getTotalRewards() external view returns (uint256);
    
    function getRequest(uint256 requestId) external view returns (LootBoxRequest memory);
    
    function getRarityWeights() external view returns (uint256[5] memory);
}
