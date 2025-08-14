// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./Interface/ILootBox.sol";
import "./IERC20.sol";
import "./IERC721.sol";
import "./IERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";

error InsufficientFunds();
error InvalidRequest();
error RewardDistributionFailed(string);
error Total_weight_must_be_positive();

contract LootBox is ILootBox, VRFConsumerBaseV2, Ownable {
    RewardERC20 private rewardToken;
    LootERC721 private rewardNFT;
    LootERC1155 private reward1155;
    uint256 private lootBoxPrice;

    VRFCoordinatorV2Interface private immutable COORDINATOR;
    uint64 private immutable subscriptionId;
    bytes32 private immutable keyHash;
    uint32 private constant callbackGasLimit = 200000;
    uint16 private constant requestConfirmations = 3;
    uint32 private constant numWords = 1;

    uint256[3] public weights;
    uint256 public totalWeight;

    uint256 public erc20RewardAmount = 100 * 10**18;
    uint256 public erc1155RewardAmount = 1;
    uint256 public erc1155TokenId = 1;

    mapping(uint256 => address) public requestToBuyer;

    event LootBoxPurchased(address indexed buyer, uint256 requestId);
    event RandomnessFulfilled(uint256 requestId, uint256 randomNumber);
    event RewardDistributed(address indexed winner, LootBoxType rewardType, uint256 value);

    constructor(
        address _rewardToken,
        address _rewardNFT,
        address _reward1155,
        uint256 _lootBoxPrice,
        uint256[3] memory _weights,
        address _vrfCoordinator,
        uint64 _subscriptionId,
        bytes32 _keyHash
    ) VRFConsumerBaseV2(_vrfCoordinator) Ownable(msg.sender) {
        rewardToken = RewardERC20(_rewardToken);
        rewardNFT = LootERC721(_rewardNFT);
        reward1155 = LootERC1155(_reward1155);
        lootBoxPrice = _lootBoxPrice;

        COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;

        weights = _weights;
        totalWeight = _weights[0] + _weights[1] + _weights[2];
        if(totalWeight == 0) revert Total_weight_must_be_positive();
    }

    function buyLootBox() external payable {
        if (msg.value < lootBoxPrice) revert InsufficientFunds();

        uint256 requestId = COORDINATOR.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );

        requestToBuyer[requestId] = msg.sender;
        emit LootBoxPurchased(msg.sender, requestId);

        if (msg.value > lootBoxPrice) {
            payable(msg.sender).transfer(msg.value - lootBoxPrice);
        }
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address buyer = requestToBuyer[requestId];
        if (buyer == address(0)) revert InvalidRequest();

        uint256 randomNumber = randomWords[0];
        emit RandomnessFulfilled(requestId, randomNumber);

        delete requestToBuyer[requestId];

        uint256 rand = randomNumber % totalWeight;
        uint256 cumulative = 0;
        LootBoxType rewardType;

        for (uint256 i = 0; i < 3; i++) {
            cumulative += weights[i];
            if (rand < cumulative) {
                rewardType = LootBoxType(i);
                break;
            }
        }

        uint256 value = 0;
        if (rewardType == LootBoxType.ERC20) {
            value = erc20RewardAmount;
            try rewardToken.transferToWinner(buyer, value) {} 
            catch {
                revert RewardDistributionFailed("ERC20 transfer failed");
            }
        } else if (rewardType == LootBoxType.ERC721) {
            try rewardNFT.safeMint(buyer) {
                // value = tokenId;
            } catch {
                revert RewardDistributionFailed("ERC721 mint failed");
            }
        } else if (rewardType == LootBoxType.ERC1155) {
            value = erc1155RewardAmount;
            try reward1155.transferToWinner(buyer, erc1155TokenId, erc1155RewardAmount, "") {} 
            catch {
                revert RewardDistributionFailed("ERC1155 transfer failed");
            }
        }

        emit RewardDistributed(buyer, rewardType, value);
    }

    function getLootBoxInfo() external view returns (LootBox memory) {
        return LootBox({
            id: 1,
            name: "Mystery Loot Box",
            description: "Open for a chance to win ERC20, ERC721, or ERC1155 rewards!",
            price: lootBoxPrice,
            maxSupply: 0,
            currentSupply: 0
        });
    }
}
