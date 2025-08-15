// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

contract MockERC721 is IERC721 {
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return interfaceId == type(IERC721).interfaceId;
    }

    function balanceOf(address owner) public view override returns (uint256) {
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) public view override returns (address) {
        return _owners[tokenId];
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external override {}
    function transferFrom(address from, address to, uint256 tokenId) external override {}
    function approve(address to, uint256 tokenId) external override {}
    function getApproved(uint256 tokenId) external view override returns (address) { return _tokenApprovals[tokenId]; }
    function setApprovalForAll(address operator, bool approved) external override {}
    function isApprovedForAll(address owner, address operator) external view override returns (bool) { return _operatorApprovals[owner][operator]; }
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external override {}
}