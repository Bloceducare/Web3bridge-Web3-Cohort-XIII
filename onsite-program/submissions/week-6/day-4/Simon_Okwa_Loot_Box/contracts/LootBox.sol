// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

/**
 * @title LootBox
 * @dev A smart contract for opening loot boxes with random rewards using Chainlink VRF
 */
contract LootBox is VRFConsumerBaseV2, Ownable, ReentrancyGuard {
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    
    // VRF Configuration
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;
    
    // Loot Box Configuration
    uint256 public boxPrice = 0.01 ether;
    uint256 public totalRewardTypes = 0;
    
    // Reward Types
    enum RewardType { ERC20, ERC721, ERC1155 }
    
    struct Reward {
        RewardType rewardType;
        address tokenContract;
        uint256 tokenId; // For ERC721/ERC1155, 0 for ERC20
        uint256 amount;  // Amount for ERC20/ERC1155
        uint256 weight;  // Higher weight = higher probability
        bool active;
    }
    
    // Storage
    mapping(uint256 => Reward) public rewards;
    mapping(uint256 => address) private s_requestIdToSender;
    uint256 private s_totalWeight;
    
    // Events
    event BoxOpened(address indexed user, uint256 indexed requestId, uint256 price);
    event RewardGranted(
        address indexed user, 
        uint256 indexed rewardId, 
        RewardType rewardType,
        address tokenContract,
        uint256 tokenId,
        uint256 amount
    );
    event RewardAdded(uint256 indexed rewardId, RewardType rewardType, uint256 weight);
    event BoxPriceUpdated(uint256 newPrice);
    event FundsWithdrawn(address indexed owner, uint256 amount);
    
    constructor(
        uint64 subscriptionId,
        address vrfCoordinatorV2,
        bytes32 gasLane,
        uint32 callbackGasLimit
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_subscriptionId = subscriptionId;
        i_gasLane = gasLane;
        i_callbackGasLimit = callbackGasLimit;
    }
    
    /**
     * @dev Opens a loot box and requests randomness
     */
    function openBox() external payable nonReentrant {
        require(msg.value >= boxPrice, "Insufficient payment");
        require(totalRewardTypes > 0, "No rewards available");
        require(s_totalWeight > 0, "No active rewards");
        
        // Request random number from Chainlink VRF
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        
        s_requestIdToSender[requestId] = msg.sender;
        
        emit BoxOpened(msg.sender, requestId, msg.value);
    }
    
    /**
     * @dev Callback function used by VRF Coordinator
     */
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        address user = s_requestIdToSender[requestId];
        require(user != address(0), "Invalid request");
        
        uint256 randomNumber = randomWords[0] % s_totalWeight;
        uint256 rewardId = _getRandomReward(randomNumber);
        
        _distributeReward(user, rewardId);
        
        delete s_requestIdToSender[requestId];
    }
    
    /**
     * @dev Determines which reward to give based on weighted randomness
     */
    function _getRandomReward(uint256 randomNumber) private view returns (uint256) {
        uint256 cumulativeWeight = 0;
        
        for (uint256 i = 0; i < totalRewardTypes; i++) {
            if (rewards[i].active) {
                cumulativeWeight += rewards[i].weight;
                if (randomNumber < cumulativeWeight) {
                    return i;
                }
            }
        }
        
        revert("No reward found");
    }
    
    /**
     * @dev Distributes the selected reward to the user
     */
    function _distributeReward(address user, uint256 rewardId) private {
        Reward memory reward = rewards[rewardId];
        require(reward.active, "Reward not active");
        
        if (reward.rewardType == RewardType.ERC20) {
            IERC20(reward.tokenContract).transfer(user, reward.amount);
        } else if (reward.rewardType == RewardType.ERC721) {
            IERC721(reward.tokenContract).transferFrom(address(this), user, reward.tokenId);
        } else if (reward.rewardType == RewardType.ERC1155) {
            IERC1155(reward.tokenContract).safeTransferFrom(
                address(this), 
                user, 
                reward.tokenId, 
                reward.amount, 
                ""
            );
        }
        
        emit RewardGranted(
            user,
            rewardId,
            reward.rewardType,
            reward.tokenContract,
            reward.tokenId,
            reward.amount
        );
    }
    
    // Owner Functions
    
    /**
     * @dev Adds a new reward to the loot box
     */
    function addReward(
        RewardType _rewardType,
        address _tokenContract,
        uint256 _tokenId,
        uint256 _amount,
        uint256 _weight
    ) external onlyOwner {
        require(_tokenContract != address(0), "Invalid token contract");
        require(_weight > 0, "Weight must be greater than 0");
        
        rewards[totalRewardTypes] = Reward({
            rewardType: _rewardType,
            tokenContract: _tokenContract,
            tokenId: _tokenId,
            amount: _amount,
            weight: _weight,
            active: true
        });
        
        s_totalWeight += _weight;
        
        emit RewardAdded(totalRewardTypes, _rewardType, _weight);
        totalRewardTypes++;
    }
    
    /**
     * @dev Toggles a reward's active status
     */
    function toggleReward(uint256 rewardId) external onlyOwner {
        require(rewardId < totalRewardTypes, "Invalid reward ID");
        
        if (rewards[rewardId].active) {
            s_totalWeight -= rewards[rewardId].weight;
            rewards[rewardId].active = false;
        } else {
            s_totalWeight += rewards[rewardId].weight;
            rewards[rewardId].active = true;
        }
    }
    
    /**
     * @dev Updates the box price
     */
    function setBoxPrice(uint256 _newPrice) external onlyOwner {
        boxPrice = _newPrice;
        emit BoxPriceUpdated(_newPrice);
    }
    
    /**
     * @dev Withdraws contract balance to owner
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
        
        emit FundsWithdrawn(owner(), balance);
    }
    
    // View Functions
    
    /**
     * @dev Returns reward details
     */
    function getReward(uint256 rewardId) external view returns (Reward memory) {
        require(rewardId < totalRewardTypes, "Invalid reward ID");
        return rewards[rewardId];
    }
    
    /**
     * @dev Returns total weight for probability calculations
     */
    function getTotalWeight() external view returns (uint256) {
        return s_totalWeight;
    }
    
    /**
     * @dev Returns contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    // ERC1155 Receiver
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public virtual returns (bytes4) {
        return this.onERC1155Received.selector;
    }
    
    function onERC1155BatchReceived(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public virtual returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
}