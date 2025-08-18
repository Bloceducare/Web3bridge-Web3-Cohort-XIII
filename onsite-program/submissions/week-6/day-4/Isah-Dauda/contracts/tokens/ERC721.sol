// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IERC165.sol";
import "../interfaces/IERC721.sol";
import "../interfaces/IERC721Receiver.sol";

contract ERC721 is IERC721 {
    string public name = "NFTLooters";
    string public symbol = "NFT-L";

    mapping(uint256 => address) private _ownerOf;
    mapping(address => uint256) private _balanceOf;
    mapping(uint256 => address) private _approvals;
    mapping(address => mapping(address => bool)) private _operatorApproval;

    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return interfaceId == type(IERC165).interfaceId || interfaceId == type(IERC721).interfaceId;
    }

    function balanceOf(address owner) external view override returns (uint256) {
        return _balanceOf[owner];
    }

    function ownerOf(uint256 tokenId) public view override returns (address) {
        return _ownerOf[tokenId];
    }

    function _mint(address to, uint256 tokenId) external {
        require(_ownerOf[tokenId] == address(0), "minted");
        _ownerOf[tokenId] = to;
        _balanceOf[to] += 1;
        emit Transfer(address(0), to, tokenId);
    }

    function approve(address to, uint256 tokenId) external override {
        address owner = ownerOf(tokenId);
        require(msg.sender == owner || _operatorApproval[owner][msg.sender], "not auth");
        _approvals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }

    function getApproved(uint256 tokenId) external view override returns (address operator) {
        return _approvals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) external override {
        _operatorApproval[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address owner, address operator) external view override returns (bool) {
        return _operatorApproval[owner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public override {
        address owner = ownerOf(tokenId);
        require(owner == from, "owner");
        require(
            msg.sender == owner || _operatorApproval[owner][msg.sender] || _approvals[tokenId] == msg.sender,
            "not auth"
        );
        _ownerOf[tokenId] = to;
        _balanceOf[from] -= 1;
        _balanceOf[to] += 1;
        delete _approvals[tokenId];
        emit Transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external override {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override {
        transferFrom(from, to, tokenId);
        if (to.code.length != 0) {
            require(
                IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) ==
                    IERC721Receiver.onERC721Received.selector,
                "unsafe"
            );
        }
    }
}
