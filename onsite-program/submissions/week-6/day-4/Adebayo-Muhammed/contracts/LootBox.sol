// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract LootBox is VRFConsumerBaseV2, Ownable, ReentrancyGuard {
    
    VRFCoordinatorV2Interface COORDINATOR;
    uint64 s_subscriptionId;
    bytes32 keyHash = 0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c; // Sepolia
    uint32 callbackGasLimit = 200000;
    uint16 requestConfirmations = 3;
    uint32 numWords = 1;
    
    uint256 public boxPrice;
    
    enum RewardType { ERC20, ERC721, ERC1155, NOTHING }
    
    struct Reward {
        RewardType rewardType;
        address tokenContract;
        uint256 tokenId;     
        uint256 amount;       
        uint256 weight;     
        string name;        
    }
    
    Reward[] public rewards;
    uint256 public totalWeight;
    
    mapping(uint256 => address) public requestToUser;
    mapping(address => uint256) public userBoxesOpened;
    
    event BoxOpened(address indexed user, uint256 requestId, uint256 paid);
    event RewardGiven(address indexed user, RewardType rewardType, address tokenContract, uint256 tokenId, uint256 amount, string name);
    event RewardAdded(uint256 indexed index, RewardType rewardType, uint256 weight, string name);
    event BoxPriceChanged(uint256 oldPrice, uint256 newPrice);
    
    constructor(
        uint64 subscriptionId,
        uint256 _boxPrice
    ) VRFConsumerBaseV2(0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625) {
        COORDINATOR = VRFCoordinatorV2Interface(0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625);
        s_subscriptionId = subscriptionId;
        boxPrice = _boxPrice;
   
        _addReward(RewardType.NOTHING, address(0), 0, 0, 50, "Better Luck Next Time!");
    }
  
    function openBox() external payable nonReentrant {
        require(msg.value >= boxPrice, "Not enough ETH");
        require(rewards.length > 0, "No rewards available");
        
        uint256 requestId = COORDINATOR.requestRandomWords(
            keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
        
        requestToUser[requestId] = msg.sender;
        userBoxesOpened[msg.sender]++;
        
        emit BoxOpened(msg.sender, requestId, msg.value);
        
        if (msg.value > boxPrice) {
            payable(msg.sender).transfer(msg.value - boxPrice);
        }
    }
    

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address user = requestToUser[requestId];
        require(user != address(0), "Invalid request");
        
        Reward memory selectedReward = _selectReward(randomWords[0]);
        
        _giveReward(user, selectedReward);
        
        emit RewardGiven(user, selectedReward.rewardType, selectedReward.tokenContract, selectedReward.tokenId, selectedReward.amount, selectedReward.name);
        
        delete requestToUser[requestId];
    }
    
    function _selectReward(uint256 randomNumber) internal view returns (Reward memory) {
        uint256 randomIndex = randomNumber % totalWeight;
        uint256 currentWeight = 0;
        
        for (uint256 i = 0; i < rewards.length; i++) {
            currentWeight += rewards[i].weight;
            if (randomIndex < currentWeight) {
                return rewards[i];
            }
        }
        
        return rewards[0]; 
    }
    
    function _giveReward(address user, Reward memory reward) internal {
        if (reward.rewardType == RewardType.ERC20) {
            IERC20(reward.tokenContract).transfer(user, reward.amount);
        } 
        else if (reward.rewardType == RewardType.ERC721) {
            IERC721(reward.tokenContract).transferFrom(address(this), user, reward.tokenId);
        } 
        else if (reward.rewardType == RewardType.ERC1155) {
            IERC1155(reward.tokenContract).safeTransferFrom(address(this), user, reward.tokenId, reward.amount, "");
        }
    }


    function addReward(
        RewardType _rewardType,
        address _tokenContract,
        uint256 _tokenId,
        uint256 _amount,
        uint256 _weight,
        string memory _name
    ) external onlyOwner {
        _addReward(_rewardType, _tokenContract, _tokenId, _amount, _weight, _name);
    }
    
    function _addReward(
        RewardType _rewardType,
        address _tokenContract,
        uint256 _tokenId,
        uint256 _amount,
        uint256 _weight,
        string memory _name
    ) internal {
        require(_weight > 0, "Weight must be > 0");
        
        rewards.push(Reward({
            rewardType: _rewardType,
            tokenContract: _tokenContract,
            tokenId: _tokenId,
            amount: _amount,
            weight: _weight,
            name: _name
        }));
        
        totalWeight += _weight;
        
        emit RewardAdded(rewards.length - 1, _rewardType, _weight, _name);
    }
    
    function setBoxPrice(uint256 _newPrice) external onlyOwner {
        uint256 oldPrice = boxPrice;
        boxPrice = _newPrice;
        emit BoxPriceChanged(oldPrice, _newPrice);
    }
    
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds");
        payable(owner()).transfer(balance);
    }
    
    
    function getRewardsCount() external view returns (uint256) {
        return rewards.length;
    }
    
    function getReward(uint256 index) external view returns (Reward memory) {
        require(index < rewards.length, "Invalid index");
        return rewards[index];
    }
    
    function getRewardProbability(uint256 index) external view returns (uint256) {
        require(index < rewards.length, "Invalid index");
        if (totalWeight == 0) return 0;
        return (rewards[index].weight * 10000) / totalWeight;
    }
    
    function getAllRewards() external view returns (Reward[] memory) {
        return rewards;
    }
    
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
} 