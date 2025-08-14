// MockERC721.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockERC721 {
    string public name;
    string public symbol;
    
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    
    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }
    
    function mint(address to, uint256 tokenId) public {
        require(_owners[tokenId] == address(0), "Token already exists");
        _owners[tokenId] = to;
        _balances[to]++;
    }
    
    function ownerOf(address, uint256 tokenId) public view returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "Token does not exist");
        return owner;
    }
    
    function balanceOf(address owner) public view returns (uint256) {
        require(owner != address(0), "Invalid owner address");
        return _balances[owner];
    }
}