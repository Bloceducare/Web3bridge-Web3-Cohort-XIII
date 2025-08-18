// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

import "../libraries/Data.sol";
import "../interfaces/TokenInterfaces.sol";
import "./LootBox.sol";

contract LootBoxFactory {
    address public immutable admin;

    
    mapping(address => address[]) public userLootBox;
    

    receive() external payable {}

    constructor() {
        admin = msg.sender;
    }

    function createLootBox() external payable returns(address) {

        LootBox newLootBox = new LootBox(msg.sender);

        userLootBox[msg.sender].push(address(newLootBox));

        emit Data.LootBoxCreated(msg.sender, address(newLootBox));

        return address(newLootBox);

    }

    function getUserLootBox(address _user) external view returns (address[] memory) {
        return userLootBox[_user];
    }

    
    function getUserLootBoxCount(address _user) external view returns (uint256) {
        return userLootBox[_user].length;
    }
}