// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockNFT is ERC721 {
    uint256 private _currentTokenId = 0;
    
    constructor() ERC721("MockNFT", "MNFT") {}
    
    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }
}