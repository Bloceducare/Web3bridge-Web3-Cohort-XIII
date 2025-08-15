// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";

contract LootBox is VRFConsumerBaseV2, Ownable, IERC1155Receiver {
    uint256 public boxFee;
    address public vrfCoordinator;
    bytes32 public keyHash;
    uint64 public subscriptionId;
    uint32 public callbackGasLimit = 100000;
    uint16 public requestConfirmations = 3;
    uint32 public numWords = 1;

    struct Reward {
        uint8 rewardType; // 0: ERC20, 1: ERC721, 2: ERC1155
        address tokenAddress;
        uint256 amountOrId;
        uint256 weight;
    }

    Reward[] public rewards;
    uint256 public totalWeight;

    mapping(uint256 => address) public requestIdToUser;

    event BoxOpened(address indexed user, uint256 requestId);
    event RandomnessRequested(uint256 requestId);
    event RewardDistributed(address indexed user, uint8 rewardType, address tokenAddress, uint256 amountOrId);

    constructor(
        uint256 _boxFee,
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint64 _subscriptionId
    ) VRFConsumerBaseV2(_vrfCoordinator) Ownable(msg.sender) {
        boxFee = _boxFee;
        vrfCoordinator = _vrfCoordinator;
        keyHash = _keyHash;
        subscriptionId = _subscriptionId;
    }

    function openBox() external payable {
        require(msg.value == boxFee, "Incorrect fee");
        uint256 requestId = requestRandomWords();
        requestIdToUser[requestId] = msg.sender;
        emit BoxOpened(msg.sender, requestId);
    }

    function requestRandomWords() internal returns (uint256) {
        uint256 requestId = VRFCoordinatorV2Interface(vrfCoordinator).requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
        emit RandomnessRequested(requestId);
        return requestId;
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address user = requestIdToUser[requestId];
        require(user != address(0), "Invalid request");
        uint256 randomNumber = randomWords[0] % totalWeight;
        uint256 currentWeight;
        for (uint256 i = 0; i < rewards.length; i++) {
            currentWeight += rewards[i].weight;
            if (randomNumber < currentWeight) {
                if (rewards[i].rewardType == 0) {
                    IERC20(rewards[i].tokenAddress).transfer(user, rewards[i].amountOrId);
                } else if (rewards[i].rewardType == 1) {
                    IERC721(rewards[i].tokenAddress).safeTransferFrom(address(this), user, rewards[i].amountOrId);
                } else if (rewards[i].rewardType == 2) {
                    IERC1155(rewards[i].tokenAddress).safeTransferFrom(address(this), user, rewards[i].amountOrId, 1, "");
                }
                emit RewardDistributed(user, rewards[i].rewardType, rewards[i].tokenAddress, rewards[i].amountOrId);
                break;
            }
        }
        delete requestIdToUser[requestId];
    }

    function addReward(uint8 rewardType, address tokenAddress, uint256 amountOrId, uint256 weight) external onlyOwner {
        rewards.push(Reward(rewardType, tokenAddress, amountOrId, weight));
        totalWeight += weight;
    }

    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // Implement IERC1155Receiver
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC1155Receiver).interfaceId || interfaceId == type(IERC165).interfaceId;
    }
}