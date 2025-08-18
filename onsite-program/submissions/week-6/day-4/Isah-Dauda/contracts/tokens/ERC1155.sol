// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IERC165.sol";
import "../interfaces/IERC1155.sol";
import "../interfaces/IERC1155Receiver.sol";

contract ERC1155 is IERC1155 {
    mapping(uint256 => mapping(address => uint256)) private _balances;
    mapping(address => mapping(address => bool)) private _operatorApproval;

    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return interfaceId == type(IERC165).interfaceId || interfaceId == type(IERC1155).interfaceId;
    }

    function balanceOf(address account, uint256 id) external view override returns (uint256) {
        return _balances[id][account];
    }

    function balanceOfBatch(address[] calldata accounts, uint256[] calldata ids) external view override returns (uint256[] memory) {
        require(accounts.length == ids.length, "len");
        uint256[] memory out = new uint256[](accounts.length);
        for (uint256 i = 0; i < accounts.length; i++) {
            out[i] = _balances[ids[i]][accounts[i]];
        }
        return out;
    }

    function setApprovalForAll(address operator, bool approved) external override {
        _operatorApproval[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address account, address operator) external view override returns (bool) {
        return _operatorApproval[account][operator];
    }

    function mint(address to, uint256 id, uint256 amount) external {
        _balances[id][to] += amount;
        emit TransferSingle(msg.sender, address(0), to, id, amount);
    }

    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) public override {
        require(from == msg.sender || _operatorApproval[from][msg.sender], "not auth");
        uint256 bal = _balances[id][from];
        require(bal >= amount, "bal");
        unchecked { _balances[id][from] = bal - amount; }
        _balances[id][to] += amount;
        emit TransferSingle(msg.sender, from, to, id, amount);
        if (to.code.length != 0) {
            require(
                IERC1155Receiver(to).onERC1155Received(msg.sender, from, id, amount, data) ==
                    IERC1155Receiver.onERC1155Received.selector,
                "unsafe"
            );
        }
    }

    function safeBatchTransferFrom(address from, address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data) external override {
        require(from == msg.sender || _operatorApproval[from][msg.sender], "not auth");
        require(ids.length == amounts.length, "len");
        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            uint256 amount = amounts[i];
            uint256 bal = _balances[id][from];
            require(bal >= amount, "bal");
            unchecked { _balances[id][from] = bal - amount; }
            _balances[id][to] += amount;
        }
        emit TransferBatch(msg.sender, from, to, ids, amounts);
        if (to.code.length != 0) {
            require(
                IERC1155Receiver(to).onERC1155BatchReceived(msg.sender, from, ids, amounts, data) ==
                    IERC1155Receiver.onERC1155BatchReceived.selector,
                "unsafe"
            );
        }
    }
}
