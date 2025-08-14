// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

contract LootBox is VRFConsumerBaseV2 {
    VRFCoordinatorV2Interface COORDINATOR;

    uint64 subscriptionId;
    address vrfCoordinator = 0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B; // Sepolia VRF v2.5
    bytes32 keyHash = 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;
    uint32 callbackGasLimit = 100000; // Increased for safety
    uint16 requestConfirmations = 3;
    uint32 numWords = 1;

    // Loot box variables
    uint256 public boxPrice = 0.01 ether;
    address public owner;
   



    enum RewardType { ERC20, ERC721, ERC1155, NONE }

    struct Reward {
        RewardType rewardType;
        address tokenContract;
        uint256 tokenId; // For ERC721/ERC1155
        uint256 amount; // For ERC20/ERC1155
        uint256 weight; // Probability weight
    }

    Reward[] public rewards;
    uint256 public totalWeight;

    struct Request {
        address user;
        uint256 randomWord;
        bool fulfilled;
    }

    mapping(uint256 => Request) public requests;
    uint256 public requestCounter;


    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

   

    constructor(uint64 _subscriptionId) VRFConsumerBaseV2(vrfCoordinator) {
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        subscriptionId = _subscriptionId;
        owner = msg.sender;
        
    }

    function addReward(
        RewardType _rewardType,
        address _tokenContract,
        uint256 _tokenId,
        uint256 _amount,
        uint256 _weight
    ) external onlyOwner {
        require(_weight > 0, "Weight must be positive");
        rewards.push(Reward({
            rewardType: _rewardType,
            tokenContract: _tokenContract,
            tokenId: _tokenId,
            amount: _amount,
            weight: _weight
        }));
        totalWeight += _weight;
       
    }

    function openBox() external payable {
        require(msg.value >= boxPrice, "Incorrect amount");
        require(totalWeight > 0, "No rewards configured");

        uint256 requestId = COORDINATOR.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
        requests[requestId] = Request(msg.sender, 0, false);
        requestCounter++;
       
    }

    function fulfillRandomWords(uint256 _requestId, uint256[] memory _randomWords) internal override {
        require(!requests[_requestId].fulfilled, "Request already fulfilled");
        requests[_requestId].randomWord = _randomWords[0];
        requests[_requestId].fulfilled = true;

        address user = requests[_requestId].user;
        Reward memory reward = _selectReward(_randomWords[0]);

        if (reward.rewardType != RewardType.NONE) {
            _distributeReward(user, reward);
        }
       
    }

    function _selectReward(uint256 _randomWord) private view returns (Reward memory) {
        if (rewards.length == 0) {
            return Reward(RewardType.NONE, address(0), 0, 0, 0);
        }
        uint256 random = _randomWord % totalWeight;
        uint256 currentWeight = 0;

        for (uint256 i = 0; i < rewards.length; i++) {
            currentWeight += rewards[i].weight;
            if (random < currentWeight) {
                return rewards[i];
            }
        }
        return Reward(RewardType.NONE, address(0), 0, 0, 0);
    }

    function _distributeReward(address _user, Reward memory _reward) private {
        if (_reward.rewardType == RewardType.ERC20) {
            IERC20(_reward.tokenContract).transfer(_user, _reward.amount);
        } else if (_reward.rewardType == RewardType.ERC721) {
            IERC721(_reward.tokenContract).safeTransferFrom(address(this), _user, _reward.tokenId);
        } else if (_reward.rewardType == RewardType.ERC1155) {
            IERC1155(_reward.tokenContract).safeTransferFrom(address(this), _user, _reward.tokenId, _reward.amount, "");
        }
    }

    function setBoxPrice(uint256 _newPrice) external onlyOwner {
        boxPrice = _newPrice;
       
    }



    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner).transfer(balance);
      
    }

    function getRequestStatus(uint256 _requestId) external view returns (bool fulfilled, uint256 randomWord, address user) {
        Request memory request = requests[_requestId];
        return (request.fulfilled, request.randomWord, request.user);
    }
}