// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC721ReceiverMinimal {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}

contract TestERC721 {
    string public name;
    string public symbol;
    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => address) public getApproved;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    constructor(string memory name_, string memory symbol_) {
        name = name_;
        symbol = symbol_;
    }

    function safeMint(address to, uint256 tokenId) external {
        ownerOf[tokenId] = to;
        balanceOf[to] += 1;
        emit Transfer(address(0), to, tokenId);
    }

    function approve(address to, uint256 tokenId) external {
        require(msg.sender == ownerOf[tokenId], "own");
        getApproved[tokenId] = to;
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external {
        require(msg.sender == from || msg.sender == getApproved[tokenId], "auth");
        require(ownerOf[tokenId] == from, "own");
        ownerOf[tokenId] = to;
        balanceOf[from] -= 1;
        balanceOf[to] += 1;
        emit Transfer(from, to, tokenId);
        if (_isContract(to)) {
            require(IERC721ReceiverMinimal(to).onERC721Received(msg.sender, from, tokenId, "") == IERC721ReceiverMinimal.onERC721Received.selector, "rcv");
        }
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external {
        require(msg.sender == from || msg.sender == getApproved[tokenId], "auth");
        require(ownerOf[tokenId] == from, "own");
        ownerOf[tokenId] = to;
        balanceOf[from] -= 1;
        balanceOf[to] += 1;
        emit Transfer(from, to, tokenId);
        if (_isContract(to)) {
            require(IERC721ReceiverMinimal(to).onERC721Received(msg.sender, from, tokenId, data) == IERC721ReceiverMinimal.onERC721Received.selector, "rcv");
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


