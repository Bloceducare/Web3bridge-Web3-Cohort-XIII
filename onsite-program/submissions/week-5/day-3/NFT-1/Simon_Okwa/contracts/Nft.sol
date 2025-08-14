// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenCounter;

    constructor() ERC721("MyNFT", "MNFT") Ownable(msg.sender) {
        _tokenCounter = 0;
    }

    /**
     * @notice Mints a new NFT to the specified address with a metadata URI.
     * @param recipient The address that will receive the NFT.
     * @param tokenURI The metadata URI (e.g., ipfs://bafy.../metadata.json).
     */
    function mintNFT(address recipient, string memory tokenURI) public onlyOwner returns (uint256) {
        uint256 newTokenId = _tokenCounter;

        _safeMint(recipient, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        _tokenCounter++;
        return newTokenId;
    }

    /**
     * @notice Returns the current number of tokens minted.
     */
    function totalMinted() public view returns (uint256) {
        return _tokenCounter;
    }
}
