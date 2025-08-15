// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "./CustomERC20.sol";
import "./CustomERC1155.sol";
import "./CustomERC721.sol";
import "./SecurePseudoVRF.sol";

contract LootBox {
    CustomERC20 public vaultToken;
    CustomERC721 public nftToken;
    CustomERC1155 public multiAsset;
    SecurePseudoVRF public vrf;

    uint256 public boxPrice = 0.0001 ether;

    struct Reward {
        uint8 rewardType;  // 1=ERC20, 2=ERC721, 3=ERC1155
        uint256 itemId;    // This is for ERC721/ERC1155
        uint256 amount;    // This is for ERC20/ERC1155
        uint16 weight;     // 0-10000
    }

    Reward[] public rewards;
    uint16 public totalWeight;

    event BoxOpened(address indexed user, uint8 rewardType, uint256 itemId, uint256 amount);
    event BoxPriceUpdated(uint256 newPrice);
    event RewardAdded(uint8 rewardType, uint256 itemId, uint256 amount, uint16 weight);

    constructor(address _vaultToken, address _nftToken, address _multiAsset, address _vrf) {
        vaultToken = CustomERC20(_vaultToken);
        nftToken = CustomERC721(_nftToken);
        multiAsset = CustomERC1155(_multiAsset);
        vrf = SecurePseudoVRF(_vrf);
    }

    function setBoxPrice(uint256 _price) external {
        boxPrice = _price;
        emit BoxPriceUpdated(_price);
    }

    function addReward(uint8 _type, uint256 _itemId, uint256 _amount, uint16 _weight) external {
        rewards.push(Reward(_type, _itemId, _amount, _weight));
        totalWeight += _weight;
        emit RewardAdded(_type, _itemId, _amount, _weight);
    }

    function openBox() external payable {
        require(msg.value >= boxPrice, "LootBox: Insufficient fee");

        uint256 rand = vrf.getSecureRandomNumber(totalWeight);
        uint16 cummulative;

        Reward memory wonReward;

        for (uint index = 0; index < rewards.length; index++) {
            cummulative += rewards[index].weight;

            if(rand < cummulative) {
                wonReward = rewards[index];
                break;
            }
        }

        if(wonReward.rewardType == 1) {
            vaultToken.transfer(msg.sender, wonReward.amount);
        } else if(wonReward.rewardType == 2) {
            nftToken.mintNFT(msg.sender);
        } else if(wonReward.rewardType == 3) {
            multiAsset.mintItem(msg.sender, wonReward.itemId, wonReward.amount);
        }

        emit BoxOpened(msg.sender, wonReward.rewardType, wonReward.itemId, wonReward.amount);
    }

    function withdrawFunds(address payable _to) external {
        _to.transfer(address(this).balance);
    }
}
