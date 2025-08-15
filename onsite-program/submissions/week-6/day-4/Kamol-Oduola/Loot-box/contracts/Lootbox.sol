// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Interface/LinkTokenInterface.sol";
import "./Interface/IVRFCoordinator.sol";


contract LootBox is Ownable {
    IERC20 public rewardERC20;
    IERC721 public rewardERC721;
    IERC1155 public rewardERC1155;

    VRFCoordinatorV2Interface public vrfCoordinator;
    LinkTokenInterface public linkToken;

    uint64 public subscriptionId;
    bytes32 public keyHash;
    uint256 public boxFee;

    mapping(uint256 => address) public requestToSender;

    event LootBoxOpened(address indexed user, uint256 requestId);
    event LootBoxResult(address indexed user, uint256 randomness, string rewardType);

    constructor(
        address _vrfCoordinator,
        address _linkToken,
        bytes32 _keyHash,
        uint64 _subscriptionId,
        uint256 _boxFee,
        address _erc20,
        address _erc721,
        address _erc1155
    ) Ownable(msg.sender) {
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        linkToken = LinkTokenInterface(_linkToken);
        keyHash = _keyHash;
        subscriptionId = _subscriptionId;
        boxFee = _boxFee;
        rewardERC20 = IERC20(_erc20);
        rewardERC721 = IERC721(_erc721);
        rewardERC1155 = IERC1155(_erc1155);
    }

    function openLootBox() external payable returns (uint256 requestId) {
        require(msg.value >= boxFee, "Not enough ETH to open loot box");

        // Request randomness
        requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            3, // min confirmations
            200000, // callbackGasLimit
            1 // numWords
        );

        requestToSender[requestId] = msg.sender;

        emit LootBoxOpened(msg.sender, requestId);
    }

    // This should be called by VRF Coordinator after randomness is ready
    function fulfillRandomness(uint256 requestId, uint256 randomness) external {
        address user = requestToSender[requestId];
        require(user != address(0), "Invalid request ID");

        uint256 result = randomness % 100; // 0–99
        string memory rewardType;

        if (result < 50) {
            // 50% chance: ERC20
            rewardERC20.transfer(user, 100 * 10 ** 18);
            rewardType = "ERC20";
        } else if (result < 80) {
            // 30% chance: ERC721
            rewardERC721.safeTransferFrom(address(this), user, 1); // tokenId = 1 for example
            rewardType = "ERC721";
        } else {
            // 20% chance: ERC1155
            rewardERC1155.safeTransferFrom(address(this), user, 1, 1, ""); // tokenId=1, amount=1
            rewardType = "ERC1155";
        }

        emit LootBoxResult(user, result, rewardType);
    }

    // Fund this contract with rewards
    function fundERC20(uint256 amount) external {
        rewardERC20.transferFrom(msg.sender, address(this), amount);
    }

    function fundERC721(uint256 tokenId) external {
        rewardERC721.safeTransferFrom(msg.sender, address(this), tokenId);
    }

    function fundERC1155(uint256 tokenId, uint256 amount) external {
        rewardERC1155.safeTransferFrom(msg.sender, address(this), tokenId, amount, "");
    }
}
