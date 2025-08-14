// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";

contract LootBox is VRFConsumerBaseV2, ERC1155Holder, ERC721Holder, Ownable, ReentrancyGuard {
    
    VRFCoordinatorV2Interface COORDINATOR;
    uint64 subscriptionId;
    address vrfCoordinator = 0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B; // Sepolia
    bytes32 keyHash = 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;
    uint32 callbackGasLimit = 200000; // Increased for safety
    uint16 requestConfirmations = 3;
    uint32 numWords = 1;

    // Reward structures
    struct RewardTier {
        uint256 weight;
        uint256 minAmount;
        uint256 maxAmount;
        bool active;
    }

    struct TokenContracts {
        IERC20 erc20Token;
        IERC721 erc721Token;
        IERC1155 erc1155Token;
        uint256 erc1155TokenId;
    }

    TokenContracts public tokens;
    
    // Loot box price
    uint256 public boxPrice = 0.01 ether;
    
    // Reward tiers: ERC20, ERC1155, ERC721
    RewardTier[] public rewardTiers;
    uint256 public totalWeight;
    
    // Inventory tracking
    mapping(uint256 => uint256) public availableERC721Tokens; // tokenId => available
    uint256 public availableERC721Count;
    
    // VRF request tracking
    struct PendingRequest {
        address user;
        uint256 timestamp;
        bool fulfilled;
    }
    mapping(uint256 => PendingRequest) public pendingRequests;
    
    // Events
    event BoxOpened(address indexed user, uint256 requestId);
    event RewardAssigned(address indexed user, string rewardType, uint256 amount, uint256 tokenId);
    event FundsWithdrawn(address indexed owner, uint256 amount);
    event RewardTierUpdated(uint256 indexed tierId, uint256 weight, uint256 minAmount, uint256 maxAmount);
    event TokenContractsUpdated(address erc20, address erc721, address erc1155, uint256 erc1155TokenId);
    event InventoryReplenished(string tokenType, uint256 amount);
    
    // Custom errors
    error InsufficientPayment();
    error InsufficientInventory();
    error InvalidRequest();
    error TransferFailed();
    error InvalidTierConfiguration();

    constructor(
        uint64 _subscriptionId,
        address _erc20Token,
        address _erc721Token,
        address _erc1155Token,
        uint256 _erc1155TokenId
    ) VRFConsumerBaseV2(vrfCoordinator) Ownable(msg.sender) {
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        subscriptionId = _subscriptionId;
        
        tokens = TokenContracts({
            erc20Token: IERC20(_erc20Token),
            erc721Token: IERC721(_erc721Token),
            erc1155Token: IERC1155(_erc1155Token),
            erc1155TokenId: _erc1155TokenId
        });

        // Initialize default reward tiers
        _initializeRewardTiers();
    }

    function _initializeRewardTiers() private {
        // ERC20 tier - 50% chance, 50-200 tokens
        rewardTiers.push(RewardTier({
            weight: 50,
            minAmount: 50 * 10**18,
            maxAmount: 200 * 10**18,
            active: true
        }));
        
        // ERC1155 tier - 30% chance, 1-10 items
        rewardTiers.push(RewardTier({
            weight: 30,
            minAmount: 1,
            maxAmount: 10,
            active: true
        }));
        
        // ERC721 tier - 20% chance, 1 NFT
        rewardTiers.push(RewardTier({
            weight: 20,
            minAmount: 1,
            maxAmount: 1,
            active: true
        }));
        
        _recalculateTotalWeight();
    }

    function openBox() external payable nonReentrant {
        if (msg.value < boxPrice) revert InsufficientPayment();
        
        // Check if we have any rewards available
        if (!_hasAvailableRewards()) revert InsufficientInventory();
        
        uint256 requestId = COORDINATOR.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
        
        pendingRequests[requestId] = PendingRequest({
            user: msg.sender,
            timestamp: block.timestamp,
            fulfilled: false
        });
        
        emit BoxOpened(msg.sender, requestId);
        
        // Refund excess payment
        if (msg.value > boxPrice) {
            payable(msg.sender).transfer(msg.value - boxPrice);
        }
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        PendingRequest storage request = pendingRequests[requestId];
        if (request.user == address(0) || request.fulfilled) revert InvalidRequest();
        
        request.fulfilled = true;
        address user = request.user;
        
        // Determine reward tier
        uint256 randomValue = randomWords[0] % totalWeight;
        uint256 cumulativeWeight = 0;
        
        for (uint256 i = 0; i < rewardTiers.length; i++) {
            if (!rewardTiers[i].active) continue;
            
            cumulativeWeight += rewardTiers[i].weight;
            if (randomValue < cumulativeWeight) {
                _distributeReward(user, i, randomWords[0]);
                break;
            }
        }
    }

    function _distributeReward(address user, uint256 tierId, uint256 randomSeed) private {
        RewardTier storage tier = rewardTiers[tierId];
        uint256 amount = tier.minAmount;
        
        if (tier.maxAmount > tier.minAmount) {
            amount += (randomSeed % (tier.maxAmount - tier.minAmount + 1));
        }
        
        if (tierId == 0) {
            // ERC20 reward
            _distributeERC20(user, amount);
            emit RewardAssigned(user, "ERC20", amount, 0);
        } else if (tierId == 1) {
            // ERC1155 reward
            _distributeERC1155(user, amount);
            emit RewardAssigned(user, "ERC1155", amount, tokens.erc1155TokenId);
        } else if (tierId == 2) {
            // ERC721 reward
            uint256 tokenId = _distributeERC721(user, randomSeed);
            emit RewardAssigned(user, "ERC721", 1, tokenId);
        }
    }

    function _distributeERC20(address user, uint256 amount) private {
        uint256 balance = tokens.erc20Token.balanceOf(address(this));
        if (balance < amount) revert InsufficientInventory();
        
        bool success = tokens.erc20Token.transfer(user, amount);
        if (!success) revert TransferFailed();
    }

    function _distributeERC1155(address user, uint256 amount) private {
        uint256 balance = tokens.erc1155Token.balanceOf(address(this), tokens.erc1155TokenId);
        if (balance < amount) revert InsufficientInventory();
        
        tokens.erc1155Token.safeTransferFrom(address(this), user, tokens.erc1155TokenId, amount, "");
    }

    function _distributeERC721(address user, uint256 randomSeed) private returns (uint256) {
        if (availableERC721Count == 0) revert InsufficientInventory();
        
        // Find a random available token
        uint256 randomIndex = randomSeed % availableERC721Count;
        uint256 currentIndex = 0;
        uint256 selectedTokenId = 0;
        
        for (uint256 tokenId = 0; tokenId < 1000; tokenId++) { // Assuming max 1000 NFTs
            if (availableERC721Tokens[tokenId] > 0) {
                if (currentIndex == randomIndex) {
                    selectedTokenId = tokenId;
                    break;
                }
                currentIndex++;
            }
        }
        
        // Transfer the NFT
        tokens.erc721Token.safeTransferFrom(address(this), user, selectedTokenId);
        
        // Update inventory
        availableERC721Tokens[selectedTokenId] = 0;
        availableERC721Count--;
        
        return selectedTokenId;
    }

    function _hasAvailableRewards() private view returns (bool) {
        // Check ERC20
        if (rewardTiers[0].active && tokens.erc20Token.balanceOf(address(this)) >= rewardTiers[0].minAmount) {
            return true;
        }
        
        // Check ERC1155
        if (rewardTiers[1].active && tokens.erc1155Token.balanceOf(address(this), tokens.erc1155TokenId) >= rewardTiers[1].minAmount) {
            return true;
        }
        
        // Check ERC721
        if (rewardTiers[2].active && availableERC721Count > 0) {
            return true;
        }
        
        return false;
    }

    // Admin functions
    function updateRewardTier(uint256 tierId, uint256 weight, uint256 minAmount, uint256 maxAmount, bool active) external onlyOwner {
        if (tierId >= rewardTiers.length) revert InvalidTierConfiguration();
        if (maxAmount < minAmount) revert InvalidTierConfiguration();
        
        rewardTiers[tierId] = RewardTier({
            weight: weight,
            minAmount: minAmount,
            maxAmount: maxAmount,
            active: active
        });
        
        _recalculateTotalWeight();
        emit RewardTierUpdated(tierId, weight, minAmount, maxAmount);
    }

    function updateTokenContracts(address _erc20, address _erc721, address _erc1155, uint256 _erc1155TokenId) external onlyOwner {
        tokens.erc20Token = IERC20(_erc20);
        tokens.erc721Token = IERC721(_erc721);
        tokens.erc1155Token = IERC1155(_erc1155);
        tokens.erc1155TokenId = _erc1155TokenId;
        
        emit TokenContractsUpdated(_erc20, _erc721, _erc1155, _erc1155TokenId);
    }

    function updateBoxPrice(uint256 newPrice) external onlyOwner {
        boxPrice = newPrice;
    }

    function replenishERC721Inventory(uint256[] calldata tokenIds) external onlyOwner {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            if (tokens.erc721Token.ownerOf(tokenId) == address(this) && availableERC721Tokens[tokenId] == 0) {
                availableERC721Tokens[tokenId] = 1;
                availableERC721Count++;
            }
        }
        emit InventoryReplenished("ERC721", tokenIds.length);
    }

    function _recalculateTotalWeight() private {
        totalWeight = 0;
        for (uint256 i = 0; i < rewardTiers.length; i++) {
            if (rewardTiers[i].active) {
                totalWeight += rewardTiers[i].weight;
            }
        }
    }

    // Emergency functions
    function emergencyWithdrawTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }

    function emergencyWithdrawNFT(address nftContract, uint256 tokenId) external onlyOwner {
        IERC721(nftContract).safeTransferFrom(address(this), owner(), tokenId);
    }

    function withdraw() external onlyOwner nonReentrant {
        uint256 amount = address(this).balance;
        payable(owner()).transfer(amount);
        emit FundsWithdrawn(owner(), amount);
    }

    // View functions
    function getRewardTier(uint256 tierId) external view returns (RewardTier memory) {
        return rewardTiers[tierId];
    }

    function getPendingRequest(uint256 requestId) external view returns (PendingRequest memory) {
        return pendingRequests[requestId];
    }

    function getInventoryStatus() external view returns (uint256 erc20Balance, uint256 erc1155Balance, uint256 erc721Count) {
        erc20Balance = tokens.erc20Token.balanceOf(address(this));
        erc1155Balance = tokens.erc1155Token.balanceOf(address(this), tokens.erc1155TokenId);
        erc721Count = availableERC721Count;
    }

    receive() external payable {}
}