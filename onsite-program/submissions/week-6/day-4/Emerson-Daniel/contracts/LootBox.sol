// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title LootBox
 * @dev A mystery box smart contract that distributes ERC721 NFT rewards using Chainlink VRF for randomness
 * @author Web3Bridge Cohort XIII
 */
contract LootBox is VRFConsumerBaseV2, Ownable, IERC721Receiver, ReentrancyGuard, Pausable {
    // VRF Configuration
    VRFCoordinatorV2Interface private immutable vrfCoordinator;
    bytes32 private immutable keyHash;
    uint64 private immutable subscriptionId;
    uint32 private callbackGasLimit = 100000;
    uint16 private requestConfirmations = 3;
    uint32 private numWords = 1;

    // Box Configuration
    uint256 public boxFee;
    uint256 public totalBoxesOpened;
    uint256 public totalRewardsDistributed;

    // Reward Structure
    struct Reward {
        address nftContract;    // ERC721 contract address
        uint256 tokenId;       // Specific NFT token ID
        uint256 weight;        // Probability weight (higher = more likely)
        bool active;           // Whether this reward is still available
    }

    // Storage
    Reward[] public rewards;
    uint256 public totalWeight;

    // Mappings
    mapping(uint256 => address) public requestIdToUser;
    mapping(address => uint256) public userBoxesOpened;
    mapping(address => uint256) public userRewardsReceived;

    // Events
    event BoxOpened(
        address indexed user,
        uint256 indexed requestId,
        uint256 boxNumber,
        uint256 timestamp
    );

    event RandomnessRequested(
        uint256 indexed requestId,
        address indexed user
    );

    event RewardDistributed(
        address indexed user,
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 rewardIndex,
        uint256 timestamp
    );

    event RewardAdded(
        uint256 indexed rewardIndex,
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 weight
    );

    event RewardRemoved(
        uint256 indexed rewardIndex,
        address indexed nftContract,
        uint256 indexed tokenId
    );

    event BoxFeeUpdated(
        uint256 oldFee,
        uint256 newFee
    );

    event VRFConfigUpdated(
        uint32 callbackGasLimit,
        uint16 requestConfirmations
    );

    // Custom Errors
    error IncorrectFee(uint256 required, uint256 provided);
    error NoRewardsAvailable();
    error NoActiveRewards();
    error InvalidRewardIndex(uint256 index);
    error RewardAlreadyInactive(uint256 index);
    error InvalidNFTContract(address nftContract);
    error NFTTransferFailed(address nftContract, uint256 tokenId);
    error InvalidRequestId(uint256 requestId);
    error ZeroAddress();
    error ZeroAmount();

    /**
     * @dev Constructor
     * @param _boxFee Fee required to open a box (in wei)
     * @param _vrfCoordinator Chainlink VRF Coordinator address
     * @param _keyHash Chainlink VRF Key Hash
     * @param _subscriptionId Chainlink VRF Subscription ID
     */
    constructor(
        uint256 _boxFee,
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint64 _subscriptionId
    ) VRFConsumerBaseV2(_vrfCoordinator) Ownable(msg.sender) {
        if (_boxFee == 0) revert ZeroAmount();
        if (_vrfCoordinator == address(0)) revert ZeroAddress();

        boxFee = _boxFee;
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        keyHash = _keyHash;
        subscriptionId = _subscriptionId;
    }

    /**
     * @dev Open a loot box by paying the required fee
     * @notice User must pay exact box fee to open a box
     */
    function openBox() external payable nonReentrant whenNotPaused {
        if (msg.value != boxFee) {
            revert IncorrectFee(boxFee, msg.value);
        }
        if (rewards.length == 0) {
            revert NoRewardsAvailable();
        }
        if (totalWeight == 0) {
            revert NoActiveRewards();
        }

        // Request randomness from Chainlink VRF
        uint256 requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );

        // Store request mapping
        requestIdToUser[requestId] = msg.sender;

        // Update counters
        totalBoxesOpened++;
        userBoxesOpened[msg.sender]++;

        emit BoxOpened(msg.sender, requestId, totalBoxesOpened, block.timestamp);
        emit RandomnessRequested(requestId, msg.sender);
    }

    /**
     * @dev Callback function used by VRF Coordinator
     * @param requestId The ID of the VRF request
     * @param randomWords Array of random numbers
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address user = requestIdToUser[requestId];
        if (user == address(0)) {
            revert InvalidRequestId(requestId);
        }

        // Generate random number within total weight range
        uint256 randomNumber = randomWords[0] % totalWeight;
        uint256 currentWeight = 0;

        // Find the winning reward based on weighted probability
        for (uint256 i = 0; i < rewards.length; i++) {
            if (!rewards[i].active) continue;

            currentWeight += rewards[i].weight;
            if (randomNumber < currentWeight) {
                _distributeReward(user, i);
                break;
            }
        }

        // Clean up request mapping
        delete requestIdToUser[requestId];
    }

    /**
     * @dev Internal function to distribute reward to user
     * @param user Address of the user receiving the reward
     * @param rewardIndex Index of the reward in the rewards array
     */
    function _distributeReward(address user, uint256 rewardIndex) internal {
        Reward storage reward = rewards[rewardIndex];

        // Transfer NFT to user
        try IERC721(reward.nftContract).safeTransferFrom(
            address(this),
            user,
            reward.tokenId
        ) {
            // Mark reward as inactive (one-time use)
            reward.active = false;
            totalWeight -= reward.weight;

            // Update counters
            totalRewardsDistributed++;
            userRewardsReceived[user]++;

            emit RewardDistributed(
                user,
                reward.nftContract,
                reward.tokenId,
                rewardIndex,
                block.timestamp
            );
        } catch {
            revert NFTTransferFailed(reward.nftContract, reward.tokenId);
        }
    }

    // ============ ADMIN FUNCTIONS ============

    /**
     * @dev Add a new NFT reward to the loot box
     * @param nftContract Address of the ERC721 contract
     * @param tokenId Token ID of the NFT
     * @param weight Probability weight for this reward
     */
    function addReward(
        address nftContract,
        uint256 tokenId,
        uint256 weight
    ) external onlyOwner {
        if (nftContract == address(0)) revert ZeroAddress();
        if (weight == 0) revert ZeroAmount();

        // Verify it's a valid ERC721 contract
        if (!IERC165(nftContract).supportsInterface(type(IERC721).interfaceId)) {
            revert InvalidNFTContract(nftContract);
        }

        // Verify contract owns the NFT
        require(
            IERC721(nftContract).ownerOf(tokenId) == address(this),
            "Contract must own the NFT"
        );

        rewards.push(Reward({
            nftContract: nftContract,
            tokenId: tokenId,
            weight: weight,
            active: true
        }));

        totalWeight += weight;

        emit RewardAdded(rewards.length - 1, nftContract, tokenId, weight);
    }

    /**
     * @dev Remove a reward from the loot box
     * @param rewardIndex Index of the reward to remove
     */
    function removeReward(uint256 rewardIndex) external onlyOwner {
        if (rewardIndex >= rewards.length) {
            revert InvalidRewardIndex(rewardIndex);
        }
        if (!rewards[rewardIndex].active) {
            revert RewardAlreadyInactive(rewardIndex);
        }

        Reward storage reward = rewards[rewardIndex];

        // Update total weight
        totalWeight -= reward.weight;
        reward.active = false;

        emit RewardRemoved(rewardIndex, reward.nftContract, reward.tokenId);
    }

    /**
     * @dev Update the box opening fee
     * @param newFee New fee amount in wei
     */
    function updateBoxFee(uint256 newFee) external onlyOwner {
        if (newFee == 0) revert ZeroAmount();

        uint256 oldFee = boxFee;
        boxFee = newFee;

        emit BoxFeeUpdated(oldFee, newFee);
    }

    /**
     * @dev Update VRF configuration
     * @param _callbackGasLimit Gas limit for VRF callback
     * @param _requestConfirmations Number of confirmations for VRF request
     */
    function updateVRFConfig(
        uint32 _callbackGasLimit,
        uint16 _requestConfirmations
    ) external onlyOwner {
        callbackGasLimit = _callbackGasLimit;
        requestConfirmations = _requestConfirmations;

        emit VRFConfigUpdated(_callbackGasLimit, _requestConfirmations);
    }

    /**
     * @dev Emergency pause function
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause function
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Withdraw collected fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Fee withdrawal failed");
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @dev Get total number of rewards
     */
    function getRewardsCount() external view returns (uint256) {
        return rewards.length;
    }

    /**
     * @dev Get number of active rewards
     */
    function getActiveRewardsCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < rewards.length; i++) {
            if (rewards[i].active) count++;
        }
        return count;
    }

    /**
     * @dev Get reward probability in basis points (1/10000)
     * @param rewardIndex Index of the reward
     * @return Probability in basis points (e.g., 2500 = 25%)
     */
    function getRewardProbability(uint256 rewardIndex) external view returns (uint256) {
        if (rewardIndex >= rewards.length) {
            revert InvalidRewardIndex(rewardIndex);
        }
        if (!rewards[rewardIndex].active || totalWeight == 0) {
            return 0;
        }
        return (rewards[rewardIndex].weight * 10000) / totalWeight;
    }

    /**
     * @dev Get reward details
     * @param rewardIndex Index of the reward
     */
    function getReward(uint256 rewardIndex) external view returns (
        address nftContract,
        uint256 tokenId,
        uint256 weight,
        bool active
    ) {
        if (rewardIndex >= rewards.length) {
            revert InvalidRewardIndex(rewardIndex);
        }

        Reward memory reward = rewards[rewardIndex];
        return (reward.nftContract, reward.tokenId, reward.weight, reward.active);
    }

    /**
     * @dev Get all active rewards
     */
    function getActiveRewards() external view returns (
        address[] memory nftContracts,
        uint256[] memory tokenIds,
        uint256[] memory weights
    ) {
        uint256 activeCount = 0;

        // Count active rewards
        for (uint256 i = 0; i < rewards.length; i++) {
            if (rewards[i].active) activeCount++;
        }

        // Initialize arrays
        nftContracts = new address[](activeCount);
        tokenIds = new uint256[](activeCount);
        weights = new uint256[](activeCount);

        // Populate arrays
        uint256 index = 0;
        for (uint256 i = 0; i < rewards.length; i++) {
            if (rewards[i].active) {
                nftContracts[index] = rewards[i].nftContract;
                tokenIds[index] = rewards[i].tokenId;
                weights[index] = rewards[i].weight;
                index++;
            }
        }
    }

    /**
     * @dev Get user statistics
     * @param user Address of the user
     */
    function getUserStats(address user) external view returns (
        uint256 boxesOpened,
        uint256 rewardsReceived
    ) {
        return (userBoxesOpened[user], userRewardsReceived[user]);
    }

    /**
     * @dev Get contract statistics
     */
    function getContractStats() external view returns (
        uint256 totalBoxes,
        uint256 totalRewards,
        uint256 activeRewards,
        uint256 currentWeight,
        uint256 contractBalance
    ) {
        return (
            totalBoxesOpened,
            totalRewardsDistributed,
            this.getActiveRewardsCount(),
            totalWeight,
            address(this).balance
        );
    }

    // ============ INTERFACE IMPLEMENTATIONS ============

    /**
     * @dev Handle the receipt of an NFT
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    /**
     * @dev Check if contract supports interface
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC721Receiver).interfaceId ||
               interfaceId == type(IERC165).interfaceId;
    }

    // ============ EMERGENCY FUNCTIONS ============

    /**
     * @dev Emergency function to recover stuck NFTs (only owner)
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to recover
     * @param to Address to send the NFT to
     */
    function emergencyRecoverNFT(
        address nftContract,
        uint256 tokenId,
        address to
    ) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        IERC721(nftContract).safeTransferFrom(address(this), to, tokenId);
    }

    /**
     * @dev Emergency function to recover stuck ETH (only owner)
     */
    function emergencyRecoverETH(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        require(amount <= address(this).balance, "Insufficient balance");

        (bool success, ) = payable(to).call{value: amount}("");
        require(success, "ETH recovery failed");
    }
}