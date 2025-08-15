// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@chainlink/contracts/src/v0.8/vrf/dev/VRFCoordinatorV2_5.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/VRFV2PlusWrapperConsumerBase.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./RewardToken.sol";
import "./RewardNFT.sol";
import "./RewardMulti.sol";

contract Lootbox is VRFV2PlusWrapperConsumerBase, Ownable {
    VRFCoordinatorV2_5 private COORDINATOR;

    bytes32 private keyHash;
    uint256 private subscriptionId;
    uint256 public callbackGasLimit = 200000;

    RewardToken public erc20Token;
    RewardNFT public erc721Token;
    RewardMulti public erc1155Token;

    mapping(uint256 => address) private requestToSender;

    uint256 public lootboxPrice = 0.05 ether; // Entry fee in ETH
    uint256 public erc20RewardAmount = 100 ether;
    string public erc721MetadataURI = "ipfs://some-nft-metadata";
    uint256 public erc1155TokenId = 1;
    uint256 public erc1155Amount = 10;
    uint256 public erc20Weight = 50; // 50% chance
    uint256 public erc721Weight = 10; // 10% chance
    uint256 public erc1155Weight = 40; // 40% chance

    event LootboxOpened(address indexed user, uint256 indexed requestId);
    event RewardMinted(address indexed winner, string rewardType, uint256 amountOrId);
    event LootboxPriceUpdated(uint256 newPrice);
    event RewardParametersUpdated(uint256 erc20Amount, string erc721URI, uint256 erc1155TokenId, uint256 erc1155Amount);
    event RewardWeightsUpdated(uint256 erc20Weight, uint256 erc721Weight, uint256 erc1155Weight);
    event CallbackGasLimitUpdated(uint256 newGasLimit);

    constructor(
        address vrfCoordinator,
        bytes32 _keyHash,
        // uint64 _subId,
        address _erc20,
        address _erc721,
        address _erc1155
    ) VRFV2PlusWrapperConsumerBase(0x195f15F2d49d693cE265b4fB0fdDbE15b1850Cc1) Ownable() {
        require(vrfCoordinator != address(0), "Invalid VRF Coordinator address");
        COORDINATOR = VRFCoordinatorV2_5(vrfCoordinator);
        keyHash = _keyHash;
        subscriptionId = 68227459223378027920811061008006789759030118789767801257539086404648090869887;
        erc20Token = RewardToken(_erc20);
        erc721Token = RewardNFT(_erc721);
        erc1155Token = RewardMulti(_erc1155);
    }

    /// @notice User pays exact ETH to open a lootbox
    function openLootbox() external payable {
        require(msg.value == lootboxPrice, "Exact ETH amount required");
        uint256 requestId = COORDINATOR.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest(keyHash,
            subscriptionId,
            3,
            200000,
        1 , bytes("") )
        );
        requestToSender[requestId] = msg.sender;
        emit LootboxOpened(msg.sender, requestId);
    }





    



    /// @notice Chainlink VRF returns the randomness
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address winner = requestToSender[requestId];
        uint256 roll = randomWords[0] % 100; // Scale to 100 for weighted probabilities

        if (roll < erc20Weight) {
            erc20Token.mint(winner, erc20RewardAmount);
            emit RewardMinted(winner, "ERC20", erc20RewardAmount);
        } else if (roll < erc20Weight + erc721Weight) {
            erc721Token.mint(winner, erc721MetadataURI);
            emit RewardMinted(winner, "ERC721", 1);
        } else {
            erc1155Token.mint(winner, erc1155TokenId, erc1155Amount);
            emit RewardMinted(winner, "ERC1155", erc1155Amount);
        }

        delete requestToSender[requestId]; // Clean up mapping
    }

    /// @notice Owner can withdraw all ETH from contract
    function withdrawFunds() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "ETH transfer failed");
    }

    /// @notice Update lootbox price
    function setLootboxPrice(uint256 newPrice) external onlyOwner {
        lootboxPrice = newPrice;
        emit LootboxPriceUpdated(newPrice);
    }

    /// @notice Update reward parameters
    function setRewardParameters(
        uint256 _erc20Amount,
        string memory _erc721URI,
        uint256 _erc1155TokenId,
        uint256 _erc1155Amount
    ) external onlyOwner {
        erc20RewardAmount = _erc20Amount;
        erc721MetadataURI = _erc721URI;
        erc1155TokenId = _erc1155TokenId;
        erc1155Amount = _erc1155Amount;
        emit RewardParametersUpdated(_erc20Amount, _erc721URI, _erc1155TokenId, _erc1155Amount);
    }

    /// @notice Update reward weights
    function setRewardWeights(uint256 _erc20Weight, uint256 _erc721Weight, uint256 _erc1155Weight) external onlyOwner {
        require(_erc20Weight + _erc721Weight + _erc1155Weight == 100, "Weights must sum to 100");
        erc20Weight = _erc20Weight;
        erc721Weight = _erc721Weight;
        erc1155Weight = _erc1155Weight;
        emit RewardWeightsUpdated(_erc20Weight, _erc721Weight, _erc1155Weight);
    }

    /// @notice Update callback gas limit
    function setCallbackGasLimit(uint256 newGasLimit) external onlyOwner {
        callbackGasLimit = newGasLimit;
        emit CallbackGasLimitUpdated(newGasLimit);
    }

}