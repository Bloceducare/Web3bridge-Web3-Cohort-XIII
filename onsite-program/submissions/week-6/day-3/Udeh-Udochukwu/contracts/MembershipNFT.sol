//SPDX-License-Identifier: UNLICENSED 

pragma solidity 0.8.26;

contract MembershipNFT {
  string public name = "Membership NFT";
  string public symbol = "MNFT";
  address public immutable registry;
  uint256 private _tokenIdCounter;

  mapping(uint256 => address) private _owners;
  mapping(address => uint256) private _balances;

  constructor(address _registry) {
    registry = _registry;
  }

  function balanceOf(address owner) external view returns (uint256) {
    require(owner != address(0), "Zero address");
    return _balances[owner];
  }

  function ownerOf(uint256 tokenId) external view returns (address) {
    address owner = _owners[tokenId];
    require(owner != address(0), "Nonexistent token");
    return owner;
  }

  function transferFrom(address from, address to, uint256 tokenId) external {
    require(msg.sender == registry, "Only registry can transfer");
    require(_owners[tokenId] == from, "Not owner");
    require(to != address(0), "Transfer to zero");
    _balances[from]--;
    _balances[to]++;
    _owners[tokenId] = to;
  }

  function mint(address to) external returns (uint256) {
    require(msg.sender == registry, "Only registry can mint");
    uint256 tokenId = _tokenIdCounter++;
    _balances[to]++;
    _owners[tokenId] = to;
    return tokenId;
  }
}