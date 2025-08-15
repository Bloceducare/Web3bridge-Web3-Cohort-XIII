
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

contract LootBox is VRFConsumerBaseV2 {
    VRFCoordinatorV2Interface COORDINATOR;

    // Chainlink VRF parameters (Sepolia testnet)
    address public constant vrfCoordinator = 0x27168224eB607eFFbEC76C76A6bC2974e803A0E8;
    bytes32 public constant keyHash = 0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c;
    uint64 public subscriptionId;
    uint32 public constant callbackGasLimit = 100000;
    uint16 public constant requestConfirmations = 3;
    uint32 public constant numWords = 1;

    address public owner;
    uint256 public boxPrice = 0.01 ether;

    // Reward types and weights
    enum RewardType { ERC20, ERC721, ERC1155 }
    struct Reward {
        RewardType rewardType;
        address tokenContract;
        uint256 tokenId; // For ERC721/ERC1155
        uint256 amount; // For ERC20/ERC1155
        uint256 weight;
    }

    Reward[] public rewards;
    uint256 public totalWeight;

    // Request tracking
    struct Request {
        address user;
        bool fulfilled;
        uint256 randomWord;
    }
    mapping(uint256 => Request) public requests;

    // Events
    event BoxOpened(address indexed user, uint256 requestId);
    event RewardDistributed(address indexed user, RewardType rewardType, address tokenContract, uint256 tokenId, uint256 amount);
    event RewardAdded(RewardType rewardType, address tokenContract, uint256 tokenId, uint256 amount, uint256 weight);
    event RandomnessRequested(uint256 requestId, address user);

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
    ) external {
        require(msg.sender == owner, "Only owner");
        require(_weight > 0, "Weight must be positive");

        rewards.push(Reward({
            rewardType: _rewardType,
            tokenContract: _tokenContract,
            tokenId: _tokenId,
            amount: _amount,
            weight: _weight
        }));
        totalWeight += _weight;

        emit RewardAdded(_rewardType, _tokenContract, _tokenId, _amount, _weight);
    }

    function openBox() external payable {
        require(msg.value >= boxPrice, "Insufficient payment");
        require(totalWeight > 0, "No rewards available");

        uint256 requestId = COORDINATOR.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );

        requests[requestId] = Request({
            user: msg.sender,
            fulfilled: false,
            randomWord: 0
        });

        emit BoxOpened(msg.sender, requestId);
        emit RandomnessRequested(requestId, msg.sender);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        require(!requests[requestId].fulfilled, "Request already fulfilled");

        requests[requestId].fulfilled = true;
        requests[requestId].randomWord = randomWords[0];

        distributeReward(requestId);
    }

    function distributeReward(uint256 requestId) internal {
        Request memory request = requests[requestId];
        uint256 randomValue = request.randomWord % totalWeight;
        uint256 currentWeight = 0;

        for (uint256 i = 0; i < rewards.length; i++) {
            currentWeight += rewards[i].weight;
            if (randomValue < currentWeight) {
                if (rewards[i].rewardType == RewardType.ERC20) {
                    IERC20(rewards[i].tokenContract).transfer(request.user, rewards[i].amount);
                } else if (rewards[i].rewardType == RewardType.ERC721) {
                    IERC721(rewards[i].tokenContract).transferFrom(address(this), request.user, rewards[i].tokenId);
                } else if (rewards[i].rewardType == RewardType.ERC1155) {
                    IERC1155(rewards[i].tokenContract).safeTransferFrom(
                        address(this),
                        request.user,
                        rewards[i].tokenId,
                        rewards[i].amount,
                        ""
                    );
                }

                emit RewardDistributed(
                    request.user,
                    rewards[i].rewardType,
                    rewards[i].tokenContract,
                    rewards[i].tokenId,
                    rewards[i].amount
                );
                break;
            }
        }
    }

    function withdraw() external {
        require(msg.sender == owner, "Only owner");
        payable(owner).transfer(address(this).balance);
    }
}
