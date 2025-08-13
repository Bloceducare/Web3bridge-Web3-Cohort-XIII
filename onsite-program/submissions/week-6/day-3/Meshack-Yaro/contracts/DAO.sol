// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract DAO {

    using Counters for Counters.Counter;   
    Counters.Counter private _tokenIdCounter;

    constructor () EERC721("DAO", "DAO") Ownable(msg.sender) {

    }

    function mint(address _to) external onlyOwner returns (uint) {
        uint tokenId = _tokenIdCounter.current();
        _safeMint( _to, tokenId);
        return tokenId;
    }

}