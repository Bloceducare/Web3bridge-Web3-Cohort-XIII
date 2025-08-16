// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@chainlink/contracts/src/v0.8/dev/vrf/VRFConsumerBaseV2Plus.sol";
import "@chainlink/contracts/src/v0.8/dev/vrf/libraries/VRFV2PlusClient.sol";

interface IERC20Minimal {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IERC721Minimal {
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
    function ownerOf(uint256 tokenId) external view returns (address);
}

interface IERC1155Minimal {
    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external;
    function balanceOf(address account, uint256 id) external view returns (uint256);
}

contract LootBox is VRFConsumerBaseV2Plus {
    // VRF Configuration
    uint256 public immutable subscriptionId;
    bytes32 public immutable keyHash;
    uint32 public immutable callbackGasLimit;
    uint16 public immutable requestConfirmations;
    
    // VRF Request tracking
    mapping(uint256 => address) private vrfRequests;
    mapping(address => uint256) private pendingRequests;
    
    // Loot Box Configuration
    uint256 public feeWei;
    uint256 public totalActiveWeight;
    
    // Reentrancy protection
    bool private reentrancyLock;
    
    // Reward management
    struct Reward {
        uint8 rtype; // 0: ERC20, 1: ERC721, 2: ERC1155
        address token;
        uint256 idOrAmount;
        uint256 amount1155; // For ERC1155, this is the amount of the specific ID
        uint256 quantity;   // How many times this reward can be won
        uint256 weight;     // Chance of winning this reward
        bool active;
    }
    
    enum RewardType { ERC20, ERC721, ERC1155 }
    
    Reward[] public rewards;
    
    // Events
    event RewardAdded(uint256 indexed rewardId, uint8 rtype, address indexed token, uint256 idOrAmount, uint256 amount1155, uint256 quantity, uint256 weight);
    event BoxOpened(address indexed player, uint256 feePaid, uint256 requestId);
    event RandomNumberReceived(uint256 indexed requestId, uint256 randomValue);
    event RewardWon(address indexed player, uint256 indexed rewardId, uint8 rtype, address indexed token, uint256 tokenId, uint256 amount);
    event Withdrawn(address indexed to, uint256 amountWei);
    event FeeChanged(uint256 oldFee, uint256 newFee);
    
    // Custom errors
    error InsufficientFee();
    error NoRewardsAvailable();
    error ReentrancyGuard();
    error VRFRequestPending();
    error InvalidVRFRequest();
    
    modifier nonReentrant() {
        if (reentrancyLock) revert ReentrancyGuard();
        reentrancyLock = true;
        _;
        reentrancyLock = false;
    }
    
    constructor(
        address _vrfCoordinator,
        uint256 _subscriptionId,
        bytes32 _keyHash
    ) VRFConsumerBaseV2Plus(_vrfCoordinator) {
        feeWei = 0.01 ether;
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        callbackGasLimit = 50000; // Optimized gas limit
        requestConfirmations = 3;
    }
    
    function openBox() external payable nonReentrant {
        if (msg.value != feeWei) revert InsufficientFee();
        if (totalActiveWeight == 0) revert NoRewardsAvailable();
        if (pendingRequests[msg.sender] != 0) revert VRFRequestPending();
        
        // Request random number from VRF v2.5 using LINK payment (cheaper)
        uint256 requestId = requestRandomWords(false); // false = use LINK payment
        
        vrfRequests[requestId] = msg.sender;
        pendingRequests[msg.sender] = requestId;
        
        emit BoxOpened(msg.sender, msg.value, requestId);
    }
    
    function requestRandomWords(bool enableNativePayment) internal returns (uint256 requestId) {
        // Will revert if subscription is not set and funded.
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: 1,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({
                        nativePayment: enableNativePayment
                    })
                )
            })
        );
        return requestId;
    }
    
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address player = vrfRequests[requestId];
        if (player == address(0)) revert InvalidVRFRequest();
        
        uint256 randomValue = randomWords[0];
        emit RandomNumberReceived(requestId, randomValue);
        
        // Clear the request
        delete vrfRequests[requestId];
        delete pendingRequests[player];
        
        // Select and award reward
        _awardReward(player, randomValue);
    }
    
    function _awardReward(address player, uint256 randomValue) internal {
        uint256 selectedWeight = randomValue % totalActiveWeight;
        uint256 running = 0;
        
        for (uint256 i = 0; i < rewards.length; i++) {
            Reward storage r = rewards[i];
            if (!r.active || r.quantity == 0) continue;
            
            running += r.weight;
            if (selectedWeight < running) {
                _transferReward(player, i, r);
                _decrementOrDisable(i);
                break;
            }
        }
    }
    
    function _transferReward(address player, uint256 rewardId, Reward storage r) internal {
        if (r.rtype == 0) { // ERC20
            IERC20Minimal(r.token).transfer(player, r.idOrAmount);
            emit RewardWon(player, rewardId, r.rtype, r.token, 0, r.idOrAmount);
        } else if (r.rtype == 1) { // ERC721
            IERC721Minimal(r.token).safeTransferFrom(address(this), player, r.idOrAmount, "");
            emit RewardWon(player, rewardId, r.rtype, r.token, r.idOrAmount, 1);
        } else if (r.rtype == 2) { // ERC1155
            IERC1155Minimal(r.token).safeTransferFrom(address(this), player, r.idOrAmount, r.amount1155, "");
            emit RewardWon(player, rewardId, r.rtype, r.token, r.idOrAmount, r.amount1155);
        }
    }
    
    function _decrementOrDisable(uint256 index) internal {
        Reward storage r = rewards[index];
        if (r.quantity > 1) {
            r.quantity--;
        } else {
            r.active = false;
            totalActiveWeight -= r.weight;
        }
    }
    
    // Admin functions
    function addERC20Reward(address token, uint256 amount, uint256 quantity, uint256 weight) external onlyOwner {
        require(IERC20Minimal(token).balanceOf(address(this)) >= amount * quantity, "insufficient balance");
        rewards.push(Reward(0, token, amount, 0, quantity, weight, true));
        totalActiveWeight += weight;
        emit RewardAdded(rewards.length - 1, 0, token, amount, 0, quantity, weight);
    }
    
    function addERC721Reward(address token, uint256 tokenId, uint256 weight) external onlyOwner {
        require(IERC721Minimal(token).ownerOf(tokenId) == address(this), "token not owned by contract");
        rewards.push(Reward(1, token, tokenId, 0, 1, weight, true));
        totalActiveWeight += weight;
        emit RewardAdded(rewards.length - 1, 1, token, tokenId, 0, 1, weight);
    }
    
    function addERC1155Reward(address token, uint256 id, uint256 amount, uint256 quantity, uint256 weight) external onlyOwner {
        require(IERC1155Minimal(token).balanceOf(address(this), id) >= amount * quantity, "insufficient balance");
        rewards.push(Reward(2, token, id, amount, quantity, weight, true));
        totalActiveWeight += weight;
        emit RewardAdded(rewards.length - 1, 2, token, id, amount, quantity, weight);
    }
    
    function setFee(uint256 newFee) external onlyOwner {
        uint256 oldFee = feeWei;
        feeWei = newFee;
        emit FeeChanged(oldFee, newFee);
    }
    
    function withdrawETH(address payable to, uint256 amount) external onlyOwner {
        (bool success, ) = to.call{value: amount}("");
        require(success, "transfer failed");
        emit Withdrawn(to, amount);
    }
    
    function withdrawERC20(address token, address to, uint256 amount) external onlyOwner {
        IERC20Minimal(token).transfer(to, amount);
    }
    
    function withdrawERC721(address token, address to, uint256 tokenId) external onlyOwner {
        IERC721Minimal(token).safeTransferFrom(address(this), to, tokenId, "");
    }
    
    function withdrawERC1155(address token, address to, uint256 id, uint256 amount) external onlyOwner {
        IERC1155Minimal(token).safeTransferFrom(address(this), to, id, amount, "");
    }
    
    // View functions
    function getReward(uint256 index) external view returns (Reward memory) {
        return rewards[index];
    }
    
    function getRewardsCount() external view returns (uint256) {
        return rewards.length;
    }
    
    function getPendingRequest(address player) external view returns (uint256) {
        return pendingRequests[player];
    }
    
    // Required for VRF
    receive() external payable {}
}