// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SemiBoxToken is ERC1155, Ownable {
    uint256 public tokenId;
    mapping(uint256 => string) private _tokenURIs;

    constructor(address initialOwner) 
        ERC1155("") 
        Ownable(initialOwner) 
    {}

    function mintItem(address to, uint256 amount, string memory tokenURI) public onlyOwner {
        _mint(to, tokenId, amount, "");
        _setURI(tokenId, tokenURI);
        tokenId++;
    }

    function _setURI(uint256 _tokenId, string memory newURI) internal {
        _tokenURIs[_tokenId] = newURI;
    }

    function uri(uint256 _tokenId) public view override returns (string memory) {
        return _tokenURIs[_tokenId];
    }
}