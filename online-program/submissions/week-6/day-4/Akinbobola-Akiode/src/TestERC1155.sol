// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC1155ReceiverMinimal {
    function onERC1155Received(address operator, address from, uint256 id, uint256 value, bytes calldata data) external returns (bytes4);
    function onERC1155BatchReceived(address operator, address from, uint256[] calldata ids, uint256[] calldata values, bytes calldata data) external returns (bytes4);
}

contract TestERC1155 {
    mapping(address => mapping(uint256 => uint256)) public balanceOf;

    event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);
    event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values);

    function mint(address to, uint256 id, uint256 amount) external {
        balanceOf[to][id] += amount;
        emit TransferSingle(msg.sender, address(0), to, id, amount);
    }

    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external {
        require(msg.sender == from, "auth");
        require(balanceOf[from][id] >= amount, "bal");
        unchecked {
            balanceOf[from][id] -= amount;
            balanceOf[to][id] += amount;
        }
        emit TransferSingle(msg.sender, from, to, id, amount);
        if (_isContract(to)) {
            require(IERC1155ReceiverMinimal(to).onERC1155Received(msg.sender, from, id, amount, data) == IERC1155ReceiverMinimal.onERC1155Received.selector, "rcv");
        }
    }

    function safeBatchTransferFrom(address from, address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data) external {
        require(msg.sender == from, "auth");
        require(ids.length == amounts.length, "len");
        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            uint256 amount = amounts[i];
            require(balanceOf[from][id] >= amount, "bal");
            unchecked {
                balanceOf[from][id] -= amount;
                balanceOf[to][id] += amount;
            }
        }
        emit TransferBatch(msg.sender, from, to, ids, amounts);
        if (_isContract(to)) {
            require(IERC1155ReceiverMinimal(to).onERC1155BatchReceived(msg.sender, from, ids, amounts, data) == IERC1155ReceiverMinimal.onERC1155BatchReceived.selector, "rcv");
        }
    }

    function _isContract(address a) private view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(a)
        }
        return size > 0;
    }
}


