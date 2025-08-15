// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RewardNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenId;
    
    constructor() ERC721("Reward NFT", "RNFT") {}
    function mint(address to, string memory tokenURI) external onlyOwner {
        _mint(to, _tokenId);
        _setTokenURI(_tokenId, tokenURI);
        _tokenId++;
    }
}

