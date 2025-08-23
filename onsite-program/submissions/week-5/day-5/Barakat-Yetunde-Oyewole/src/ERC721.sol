// SPDX-License-Identifier: LICENSE
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";    

contract ERC721Token is ERC721{
    uint256 public nextTokenId = 1;

    constructor() ERC721("YETUNDE", "YT") {}

    function mint (address to) external returns (uint256) {
        uint256 tokenId = nextTokenId;
       nextTokenId++;
        _mint(to, tokenId);
        return tokenId;
    }
}