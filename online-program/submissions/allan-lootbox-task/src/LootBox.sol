// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "lib/chainlink-brownie-contracts/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "lib/chainlink-brownie-contracts/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./interfaces/ILootBox.sol";
import "./libraries/WeightedRandom.sol";

/**
 * @title LootBox
 * @dev A comprehensive loot box system with Chainlink VRF for secure randomness
 * @notice This contract allows users to purchase mystery boxes containing various rewards
 *         with different rarity levels and uses Chainlink VRF for provably fair randomness
 */
contract LootBox is 
    ILootBox, 
    VRFConsumerBaseV2, 
    Ownable, 
    ReentrancyGuard, 
    Pausable 
{
    using SafeERC20 for IERC20;
    using WeightedRandom for uint256[];

    // Chainlink VRF Configuration
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private s_keyHash;
    uint64 private s_subscriptionId;
    uint32 private s_callbackGasLimit;
    uint16 private s_requestConfirmations;

    // Contract State
    uint256 private s_boxPrice;
    uint256 private s_rewardCounter;
    uint256 private s_requestCounter;

    // Mappings
    mapping(uint256 => RewardConfig) private s_rewards;
    mapping(uint256 => LootBoxRequest) private s_requests;
    mapping(uint256 => uint256[]) private s_rewardsByRarity; // rarity => rewardIds
    mapping(address => uint256[]) private s_userRequests;

    // Rarity weights (out of 10000 basis points)
    // COMMON: 5000 (50%), UNCOMMON: 3000 (30%), RARE: 1500 (15%), EPIC: 400 (4%), LEGENDARY: 100 (1%)
    uint256[5] private s_rarityWeights = [5000, 3000, 1500, 400, 100];

    /**
     * @dev Constructor initializes the contract with Chainlink VRF parameters
     * @param vrfCoordinator Address of the Chainlink VRF Coordinator
     * @param keyHash The gas lane key hash for VRF requests
     * @param subscriptionId The subscription ID for VRF requests
     * @param callbackGasLimit Gas limit for VRF callback
     * @param requestConfirmations Number of confirmations for VRF requests
     * @param initialBoxPrice Initial price for loot boxes in wei
     */
    constructor(
        address vrfCoordinator,
        bytes32 keyHash,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint16 requestConfirmations,
        uint256 initialBoxPrice,
        address initialOwner
    ) VRFConsumerBaseV2(vrfCoordinator) Ownable(initialOwner) {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinator);
        s_keyHash = keyHash;
        s_subscriptionId = subscriptionId;
        s_callbackGasLimit = callbackGasLimit;
        s_requestConfirmations = requestConfirmations;
        s_boxPrice = initialBoxPrice;
    }

    /**
     * @dev Modifier to check if a reward exists and is active
     */
    modifier validReward(uint256 rewardId) {
        require(rewardId < s_rewardCounter, "LootBox: Reward does not exist");
        require(s_rewards[rewardId].isActive, "LootBox: Reward is not active");
        _;
    }

    /**
     * @dev Purchase a loot box and request randomness from Chainlink VRF
     * @return requestId The VRF request ID for this loot box purchase
     */
    function purchaseLootBox() 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        returns (uint256 requestId) 
    {
        require(msg.value >= s_boxPrice, "LootBox: Insufficient payment");
        require(s_rewardCounter > 0, "LootBox: No rewards available");

        // Request randomness from Chainlink VRF
        requestId = i_vrfCoordinator.requestRandomWords(
            s_keyHash,
            s_subscriptionId,
            s_requestConfirmations,
            s_callbackGasLimit,
            1 // numWords
        );

        // Store the request
        s_requests[requestId] = LootBoxRequest({
            requester: msg.sender,
            boxPrice: msg.value,
            timestamp: block.timestamp,
            fulfilled: false
        });

        s_userRequests[msg.sender].push(requestId);

        // Refund excess payment
        if (msg.value > s_boxPrice) {
            payable(msg.sender).transfer(msg.value - s_boxPrice);
        }

        emit LootBoxPurchased(msg.sender, requestId, s_boxPrice, block.timestamp);
    }

    /**
     * @dev Chainlink VRF callback function - determines and distributes rewards
     * @param requestId The VRF request ID
     * @param randomWords Array of random words from Chainlink VRF
     */
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        LootBoxRequest storage request = s_requests[requestId];
        require(!request.fulfilled, "LootBox: Request already fulfilled");
        require(request.requester != address(0), "LootBox: Invalid request");

        request.fulfilled = true;
        uint256 randomValue = randomWords[0];

        // Determine rarity using weighted random selection
        Rarity selectedRarity = _selectRarity(randomValue);
        
        // Select specific reward from the chosen rarity
        uint256 rewardId = _selectRewardFromRarity(selectedRarity, randomValue);
        
        // Distribute the reward
        _distributeReward(request.requester, rewardId, requestId);
    }

    /**
     * @dev Add a new reward to the loot box system
     * @param rewardType Type of reward (ERC20, ERC721, ERC1155)
     * @param contractAddress Address of the reward token contract
     * @param tokenId Token ID for ERC721/ERC1155 (ignored for ERC20)
     * @param amount Amount for ERC20/ERC1155 (ignored for ERC721)
     * @param rarity Rarity level of the reward
     * @return rewardId The ID of the newly added reward
     */
    function addReward(
        RewardType rewardType,
        address contractAddress,
        uint256 tokenId,
        uint256 amount,
        Rarity rarity
    ) external onlyOwner returns (uint256 rewardId) {
        require(contractAddress != address(0), "LootBox: Invalid contract address");

        if (rewardType == RewardType.ERC20) {
            require(amount > 0, "LootBox: Amount must be greater than 0 for ERC20");
        } else if (rewardType == RewardType.ERC1155) {
            require(amount > 0, "LootBox: Amount must be greater than 0 for ERC1155");
        }

        rewardId = s_rewardCounter++;

        s_rewards[rewardId] = RewardConfig({
            rewardType: rewardType,
            contractAddress: contractAddress,
            tokenId: tokenId,
            amount: amount,
            rarity: rarity,
            isActive: true
        });

        s_rewardsByRarity[uint256(rarity)].push(rewardId);

        emit RewardAdded(rewardId, rewardType, contractAddress, tokenId, amount, rarity);
    }

    /**
     * @dev Update reward active status
     * @param rewardId ID of the reward to update
     * @param isActive New active status
     */
    function updateReward(uint256 rewardId, bool isActive) external onlyOwner {
        require(rewardId < s_rewardCounter, "LootBox: Reward does not exist");

        s_rewards[rewardId].isActive = isActive;
        emit RewardUpdated(rewardId, isActive);
    }

    /**
     * @dev Set new loot box price
     * @param newPrice New price in wei
     */
    function setBoxPrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "LootBox: Price must be greater than 0");

        uint256 oldPrice = s_boxPrice;
        s_boxPrice = newPrice;
        emit BoxPriceUpdated(oldPrice, newPrice);
    }

    /**
     * @dev Update Chainlink VRF configuration
     * @param keyHash New key hash
     * @param subscriptionId New subscription ID
     * @param callbackGasLimit New callback gas limit
     * @param requestConfirmations New request confirmations
     */
    function updateVRFConfig(
        bytes32 keyHash,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint16 requestConfirmations
    ) external onlyOwner {
        s_keyHash = keyHash;
        s_subscriptionId = subscriptionId;
        s_callbackGasLimit = callbackGasLimit;
        s_requestConfirmations = requestConfirmations;

        emit VRFConfigUpdated(keyHash, subscriptionId, callbackGasLimit, requestConfirmations);
    }

    /**
     * @dev Withdraw contract funds (owner only)
     */
    function withdrawFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "LootBox: No funds to withdraw");

        payable(owner()).transfer(balance);
    }

    /**
     * @dev Emergency withdraw tokens (owner only)
     * @param token Token contract address (address(0) for ETH)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            require(amount <= address(this).balance, "LootBox: Insufficient ETH balance");
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }

    /**
     * @dev Pause the contract (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @dev Get current loot box price
     * @return Current price in wei
     */
    function getBoxPrice() external view returns (uint256) {
        return s_boxPrice;
    }

    /**
     * @dev Get reward configuration by ID
     * @param rewardId ID of the reward
     * @return RewardConfig struct
     */
    function getReward(uint256 rewardId) external view returns (RewardConfig memory) {
        require(rewardId < s_rewardCounter, "LootBox: Reward does not exist");
        return s_rewards[rewardId];
    }

    /**
     * @dev Get active rewards by rarity
     * @param rarity Rarity level to filter by
     * @return Array of active reward IDs for the specified rarity
     */
    function getActiveRewardsByRarity(Rarity rarity) external view returns (uint256[] memory) {
        uint256[] memory rarityRewards = s_rewardsByRarity[uint256(rarity)];
        uint256 activeCount = 0;

        // Count active rewards
        for (uint256 i = 0; i < rarityRewards.length; i++) {
            if (s_rewards[rarityRewards[i]].isActive) {
                activeCount++;
            }
        }

        // Create array of active rewards
        uint256[] memory activeRewards = new uint256[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < rarityRewards.length; i++) {
            if (s_rewards[rarityRewards[i]].isActive) {
                activeRewards[index] = rarityRewards[i];
                index++;
            }
        }

        return activeRewards;
    }

    /**
     * @dev Get total number of rewards
     * @return Total reward count
     */
    function getTotalRewards() external view returns (uint256) {
        return s_rewardCounter;
    }

    /**
     * @dev Get loot box request by ID
     * @param requestId VRF request ID
     * @return LootBoxRequest struct
     */
    function getRequest(uint256 requestId) external view returns (LootBoxRequest memory) {
        return s_requests[requestId];
    }

    /**
     * @dev Get rarity weights
     * @return Array of rarity weights
     */
    function getRarityWeights() external view returns (uint256[5] memory) {
        return s_rarityWeights;
    }

    /**
     * @dev Get user's loot box requests
     * @param user User address
     * @return Array of request IDs for the user
     */
    function getUserRequests(address user) external view returns (uint256[] memory) {
        return s_userRequests[user];
    }

    // ============ INTERNAL FUNCTIONS ============

    /**
     * @dev Select rarity based on weighted random selection
     * @param randomValue Random value from Chainlink VRF
     * @return selectedRarity The selected rarity level
     */
    function _selectRarity(uint256 randomValue) internal view returns (Rarity selectedRarity) {
        uint256[] memory weights = new uint256[](5);
        for (uint256 i = 0; i < 5; i++) {
            weights[i] = s_rarityWeights[i];
        }

        uint256 selectedIndex = weights.selectWeighted(randomValue);
        return Rarity(selectedIndex);
    }

    /**
     * @dev Select specific reward from a rarity category
     * @param rarity The selected rarity level
     * @param randomValue Random value for selection within rarity
     * @return rewardId The selected reward ID
     */
    function _selectRewardFromRarity(
        Rarity rarity,
        uint256 randomValue
    ) internal view returns (uint256 rewardId) {
        uint256[] memory activeRewards = _getActiveRewardsByRarityInternal(rarity);
        require(activeRewards.length > 0, "LootBox: No active rewards for selected rarity");

        uint256 selectedIndex = randomValue % activeRewards.length;
        return activeRewards[selectedIndex];
    }

    /**
     * @dev Internal function to get active rewards by rarity
     * @param rarity Rarity level
     * @return activeRewards Array of active reward IDs
     */
    function _getActiveRewardsByRarityInternal(Rarity rarity)
        internal
        view
        returns (uint256[] memory activeRewards)
    {
        uint256[] memory rarityRewards = s_rewardsByRarity[uint256(rarity)];
        uint256 activeCount = 0;

        // Count active rewards
        for (uint256 i = 0; i < rarityRewards.length; i++) {
            if (s_rewards[rarityRewards[i]].isActive) {
                activeCount++;
            }
        }

        // Create array of active rewards
        activeRewards = new uint256[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < rarityRewards.length; i++) {
            if (s_rewards[rarityRewards[i]].isActive) {
                activeRewards[index] = rarityRewards[i];
                index++;
            }
        }
    }

    /**
     * @dev Distribute reward to user
     * @param recipient Address to receive the reward
     * @param rewardId ID of the reward to distribute
     * @param requestId VRF request ID for event emission
     */
    function _distributeReward(
        address recipient,
        uint256 rewardId,
        uint256 requestId
    ) internal {
        RewardConfig memory reward = s_rewards[rewardId];
        require(reward.isActive, "LootBox: Reward is not active");

        if (reward.rewardType == RewardType.ERC20) {
            IERC20(reward.contractAddress).safeTransfer(recipient, reward.amount);
        } else if (reward.rewardType == RewardType.ERC721) {
            IERC721(reward.contractAddress).safeTransferFrom(
                address(this),
                recipient,
                reward.tokenId
            );
        } else if (reward.rewardType == RewardType.ERC1155) {
            IERC1155(reward.contractAddress).safeTransferFrom(
                address(this),
                recipient,
                reward.tokenId,
                reward.amount,
                ""
            );
        }

        emit LootBoxOpened(
            recipient,
            requestId,
            rewardId,
            reward.rewardType,
            reward.contractAddress,
            reward.tokenId,
            reward.amount,
            reward.rarity
        );
    }

    /**
     * @dev Receive function to accept ETH deposits
     */
    receive() external payable {}

    /**
     * @dev Fallback function
     */
    fallback() external payable {}
}
