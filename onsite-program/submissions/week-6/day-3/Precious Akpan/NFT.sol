// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MyNFT is ERC721 {
    uint256 private _tokenIdCounter;

    constructor() ERC721("MyNFT", "MNFT") {
        _tokenIdCounter = 0;
    }

    function mint(address to) public {
        _tokenIdCounter++;
        _safeMint(to, _tokenIdCounter);
    }
}