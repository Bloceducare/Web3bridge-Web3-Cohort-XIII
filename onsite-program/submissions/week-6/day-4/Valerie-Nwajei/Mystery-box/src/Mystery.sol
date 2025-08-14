// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "../lib/chainlink/contracts/VRFConsumerBase.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract MysteryBox is VRFConsumerBase {
    address public owner;
    uint256 public boxPrice = 0.01 ether; // Cost to open a box

    bytes32 internal keyHash;
    uint256 internal fee;

    IERC20 public rewardToken;
    IERC721 public rewardNFT;

    mapping(bytes32 => address) public requestToUser;

    event BoxOpened(address user, uint256 rewardType, uint256 amount);
    event BoxRequested(address user, bytes32 requestId);

    constructor(
        address _vrfCoordinator,
        address _linkToken,
        bytes32 _keyHash,
        uint256 _fee,
        address _rewardToken,
        address _rewardNFT
    ) VRFConsumerBase(_vrfCoordinator, _linkToken) {
        owner = msg.sender;
        keyHash = _keyHash;
        fee = _fee;
        rewardToken = IERC20(_rewardToken);
        rewardNFT = IERC721(_rewardNFT);
    }

    function openBox() external payable {
        require(msg.value >= boxPrice, "Not enough ETH sent");

        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK tokens");

        bytes32 requestId = requestRandomness(keyHash, fee);

        requestToUser[requestId] = msg.sender;

        emit BoxRequested(msg.sender, requestId);
    }

    function fulfillRandomness(
        bytes32 requestId,
        uint256 randomness
    ) internal override {
        address user = requestToUser[requestId];
        require(user != address(0), "Invalid request");

        uint256 roll = randomness % 100;

        if (roll < 60) {
            rewardToken.transfer(user, 100 * 10 ** 18);
            emit BoxOpened(user, 1, 100);
        } else if (roll < 85) {
            rewardToken.transfer(user, 500 * 10 ** 18);
            emit BoxOpened(user, 2, 500);
        } else if (roll < 97) {
            rewardToken.transfer(user, 1000 * 10 ** 18);
            emit BoxOpened(user, 3, 1000);
        } else {
            if (rewardNFT.balanceOf(address(this)) > 0) {
                uint256 tokenId = getFirstNFT();
                rewardNFT.transferFrom(address(this), user, tokenId);
                emit BoxOpened(user, 4, tokenId);
            } else {
                rewardToken.transfer(user, 2000 * 10 ** 18);
                emit BoxOpened(user, 4, 2000);
            }
        }

        delete requestToUser[requestId];
    }

    function getFirstNFT() internal view returns (uint256) {
        return 1;
    }

    function depositTokens(uint256 amount) external {
        require(msg.sender == owner, "Only owner");
        rewardToken.transferFrom(msg.sender, address(this), amount);
    }

    function withdrawETH() external {
        require(msg.sender == owner, "Only owner");
        payable(owner).transfer(address(this).balance);
    }

    function withdrawLINK() external {
        require(msg.sender == owner, "Only owner");
        LINK.transfer(owner, LINK.balanceOf(address(this)));
    }

    function getTokenBalance() external view returns (uint256) {
        return rewardToken.balanceOf(address(this));
    }

    function getLINKBalance() external view returns (uint256) {
        return LINK.balanceOf(address(this));
    }
}
