// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

contract Mystery_Box is VRFConsumerBaseV2Plus {
    
    // Simple access control
    address public admin;
    
    // VRF Configuration
    uint256 private s_subscriptionId;
    bytes32 private s_keyHash;
    uint32 private s_callbackGasLimit = 200000;
    uint16 private s_requestConfirmations = 3;
    uint32 private s_numWords = 1;
    
    // Box Configuration
    uint256 public boxPrice = 0.01 ether;
    
    // Reward Types
    enum RewardType {
        NOTHING,
        ERC20,
        ERC721,
        ERC1155
    }
    
    // Reward Configuration
    struct Reward {
        RewardType rewardType;
        address tokenContract;
        uint256 amount;
        uint256 tokenId;
        uint256 weight;
    }
    
    // Box Opening Request
    struct BoxRequest {
        address player;
        bool fulfilled;
    }
    
    // Storage
    Reward[] public rewards;
    uint256 public totalWeight;
    mapping(uint256 => BoxRequest) public boxRequests;
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }
    
    constructor(
        address vrfCoordinator,
        uint256 subscriptionId,
        bytes32 keyHash,
        address _admin
    ) 
        VRFConsumerBaseV2Plus(vrfCoordinator) 
    {
        admin = _admin;
        s_subscriptionId = subscriptionId;
        s_keyHash = keyHash;
        
        // Add default "nothing" reward with high weight
        rewards.push(Reward({
            rewardType: RewardType.NOTHING,
            tokenContract: address(0),
            amount: 0,
            tokenId: 0,
            weight: 50
        }));
        totalWeight = 50;
    }
    
    function addReward(
        RewardType _rewardType,
        address _tokenContract,
        uint256 _amount,
        uint256 _tokenId,
        uint256 _weight
    ) external onlyAdmin {
        rewards.push(Reward({
            rewardType: _rewardType,
            tokenContract: _tokenContract,
            amount: _amount,
            tokenId: _tokenId,
            weight: _weight
        }));
        
        totalWeight += _weight;
    }
    
    function openBox() external payable returns (uint256 requestId) {
        require(msg.value >= boxPrice, "Insufficient payment");
        
        // Request randomness from VRF
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: s_keyHash,
                subId: s_subscriptionId,
                requestConfirmations: s_requestConfirmations,
                callbackGasLimit: s_callbackGasLimit,
                numWords: s_numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
                )
            })
        );
        
        // Store request
        boxRequests[requestId] = BoxRequest({
            player: msg.sender,
            fulfilled: false
        });
        
        return requestId;
    }
    
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] calldata randomWords
    ) internal override {
        BoxRequest storage request = boxRequests[requestId];
        require(!request.fulfilled, "Request already fulfilled");
        
        request.fulfilled = true;
        
        // Determine reward based on weighted probability
        Reward memory selectedReward = _selectReward(randomWords[0]);
        
        // Distribute reward
        _distributeReward(request.player, selectedReward);
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
    
    function _distributeReward(address player, Reward memory reward) internal {
        if (reward.rewardType == RewardType.NOTHING) {
            return;
        } else if (reward.rewardType == RewardType.ERC20) {
            IERC20(reward.tokenContract).transfer(player, reward.amount);
        } else if (reward.rewardType == RewardType.ERC721) {
            IERC721(reward.tokenContract).transferFrom(address(this), player, reward.tokenId);
        } else if (reward.rewardType == RewardType.ERC1155) {
            IERC1155(reward.tokenContract).safeTransferFrom(
                address(this), 
                player, 
                reward.tokenId, 
                reward.amount, 
                ""
            );
        }
    }
    
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }
    
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}