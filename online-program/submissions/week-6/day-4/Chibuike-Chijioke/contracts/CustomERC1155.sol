// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

contract CustomERC1155 {
    mapping(uint256 => mapping(address => uint256)) public balances;

    event MultiItemMinted(address indexed to, uint256 indexed itemId, uint256 amount);
    event MultiItemTransferred(address indexed from, address indexed to, uint256 indexed itemId, uint256 amount);

    function mintItem(address _to, uint256 _itemId, uint256 _amount) external {
        balances[_itemId][_to] += _amount;
        emit MultiItemMinted(_to, _itemId, _amount);
    }

    function transferItem(address _to, uint256 _itemId, uint256 _amount) external {
        require(balances[_itemId][msg.sender] >= _amount, "ERC1155: Insufficient Balance");
        balances[_itemId][msg.sender] -= _amount;
        balances[_itemId][_to] += _amount;
        emit MultiItemTransferred(msg.sender, _to, _itemId, _amount);
    }
}