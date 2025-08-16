// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";

contract LootBox is VRFConsumerBaseV2, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    VRFCoordinatorV2Interface private immutable COORDINATOR;
    uint64 private s_subscriptionId;
    bytes32 private keyHash;
    uint32 private callbackGasLimit = 2500000;
    uint16 private requestConfirmations = 3;
    uint32 private numWords = 1;

    uint256 public boxPrice;
    uint256 public totalBoxes;
    uint256 public boxesSold;

    enum RewardType {
        ERC20,
        ERC721,
        ERC1155
    }

    struct Reward {
        RewardType rewardType;
        address tokenAddress;
        uint256 tokenId;
        uint256 amount;
        uint256 weight;
        bool isActive;
    }

    struct BoxRequest {
        address buyer;
        uint256 boxId;
        bool fulfilled;
    }

    Reward[] public rewards;
    uint256 public totalWeight;
    mapping(uint256 => BoxRequest) public vrfRequests;
    mapping(address => uint256[]) public userBoxes;
    mapping(uint256 => Reward) public boxRewards;

    event BoxPurchased(
        address indexed buyer,
        uint256 indexed boxId,
        uint256 requestId
    );
    event BoxOpened(
        address indexed buyer,
        uint256 indexed boxId,
        uint256 indexed rewardIndex,
        RewardType rewardType,
        address tokenAddress,
        uint256 tokenId,
        uint256 amount
    );
    event RewardAdded(
        uint256 indexed rewardIndex,
        RewardType rewardType,
        address tokenAddress,
        uint256 tokenId,
        uint256 amount,
        uint256 weight
    );
    event RewardUpdated(
        uint256 indexed rewardIndex,
        uint256 weight,
        bool isActive
    );
    event BoxPriceUpdated(uint256 newPrice);
    event FundsWithdrawn(address indexed owner, uint256 amount);

    constructor(
        uint64 subscriptionId,
        address vrfCoordinator,
        bytes32 _keyHash,
        uint256 _boxPrice
    ) VRFConsumerBaseV2(vrfCoordinator) Ownable(msg.sender) {
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        s_subscriptionId = subscriptionId;
        keyHash = _keyHash;
        boxPrice = _boxPrice;
    }

    function addReward(
        RewardType _rewardType,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _amount,
        uint256 _weight
    ) external onlyOwner {
        require(_tokenAddress != address(0), "Invalid token address");
        require(_weight > 0, "Weight must be greater than 0");

        rewards.push(
            Reward({
                rewardType: _rewardType,
                tokenAddress: _tokenAddress,
                tokenId: _tokenId,
                amount: _amount,
                weight: _weight,
                isActive: true
            })
        );

        totalWeight += _weight;

        emit RewardAdded(
            rewards.length - 1,
            _rewardType,
            _tokenAddress,
            _tokenId,
            _amount,
            _weight
        );
    }

    function updateReward(
        uint256 _rewardIndex,
        uint256 _weight,
        bool _isActive
    ) external onlyOwner {
        require(_rewardIndex < rewards.length, "Invalid reward index");

        Reward storage reward = rewards[_rewardIndex];

        if (reward.isActive) {
            totalWeight -= reward.weight;
        }
        if (_isActive) {
            totalWeight += _weight;
        }

        reward.weight = _weight;
        reward.isActive = _isActive;

        emit RewardUpdated(_rewardIndex, _weight, _isActive);
    }

    function openBox() external payable nonReentrant {
        require(msg.value >= boxPrice, "Insufficient payment");
        require(totalWeight > 0, "No rewards available");

        uint256 boxId = totalBoxes++;
        boxesSold++;

        uint256 requestId = COORDINATOR.requestRandomWords(
            keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );

        vrfRequests[requestId] = BoxRequest({
            buyer: msg.sender,
            boxId: boxId,
            fulfilled: false
        });

        userBoxes[msg.sender].push(boxId);

        emit BoxPurchased(msg.sender, boxId, requestId);

        if (msg.value > boxPrice) {
            payable(msg.sender).transfer(msg.value - boxPrice);
        }
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        BoxRequest storage request = vrfRequests[requestId];
        require(!request.fulfilled, "Request already fulfilled");
        require(request.buyer != address(0), "Invalid request");

        request.fulfilled = true;

        uint256 randomNumber = randomWords[0];
        uint256 rewardIndex = selectReward(randomNumber);
        Reward memory selectedReward = rewards[rewardIndex];

        boxRewards[request.boxId] = selectedReward;

        _transferReward(request.buyer, selectedReward);

        emit BoxOpened(
            request.buyer,
            request.boxId,
            rewardIndex,
            selectedReward.rewardType,
            selectedReward.tokenAddress,
            selectedReward.tokenId,
            selectedReward.amount
        );
    }

    function selectReward(
        uint256 randomNumber
    ) internal view returns (uint256) {
        uint256 randomWeight = randomNumber % totalWeight;
        uint256 cumulativeWeight = 0;

        for (uint256 i = 0; i < rewards.length; i++) {
            if (!rewards[i].isActive) continue;

            cumulativeWeight += rewards[i].weight;
            if (randomWeight < cumulativeWeight) {
                return i;
            }
        }

        revert("No reward selected");
    }

    function _transferReward(address to, Reward memory reward) internal {
        if (reward.rewardType == RewardType.ERC20) {
            IERC20(reward.tokenAddress).safeTransfer(to, reward.amount);
        } else if (reward.rewardType == RewardType.ERC721) {
            IERC721(reward.tokenAddress).transferFrom(
                address(this),
                to,
                reward.tokenId
            );
        } else if (reward.rewardType == RewardType.ERC1155) {
            IERC1155(reward.tokenAddress).safeTransferFrom(
                address(this),
                to,
                reward.tokenId,
                reward.amount,
                ""
            );
        }
    }

    function setBoxPrice(uint256 _newPrice) external onlyOwner {
        boxPrice = _newPrice;
        emit BoxPriceUpdated(_newPrice);
    }

    function updateVRFConfig(
        uint64 _subscriptionId,
        bytes32 _keyHash,
        uint32 _callbackGasLimit,
        uint16 _requestConfirmations
    ) external onlyOwner {
        s_subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        callbackGasLimit = _callbackGasLimit;
        requestConfirmations = _requestConfirmations;
    }

    function withdrawFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        payable(owner()).transfer(balance);
        emit FundsWithdrawn(owner(), balance);
    }

    function emergencyWithdrawERC20(
        address token,
        uint256 amount
    ) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }

    function emergencyWithdrawERC721(
        address token,
        uint256 tokenId
    ) external onlyOwner {
        IERC721(token).transferFrom(address(this), owner(), tokenId);
    }

    function emergencyWithdrawERC1155(
        address token,
        uint256 tokenId,
        uint256 amount
    ) external onlyOwner {
        IERC1155(token).safeTransferFrom(
            address(this),
            owner(),
            tokenId,
            amount,
            ""
        );
    }

    function getRewardsCount() external view returns (uint256) {
        return rewards.length;
    }

    function getReward(uint256 index) external view returns (Reward memory) {
        require(index < rewards.length, "Invalid index");
        return rewards[index];
    }

    function getUserBoxes(
        address user
    ) external view returns (uint256[] memory) {
        return userBoxes[user];
    }

    function getBoxReward(uint256 boxId) external view returns (Reward memory) {
        return boxRewards[boxId];
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC721Received.selector;
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

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
}