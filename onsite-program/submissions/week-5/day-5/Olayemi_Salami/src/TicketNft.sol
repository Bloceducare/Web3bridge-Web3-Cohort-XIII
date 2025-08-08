pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TicketNft is ERC721, Ownable {
    uint256 private _tokenIdCounter;

    constructor() ERC721("TicketNft", "TNFT") Ownable(msg.sender) {
        _tokenIdCounter = 1;
    }

    function mint(address to) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _safeMint(to, tokenId);
        _tokenIdCounter++;
        return tokenId;
    }
}