// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ERC721Mock
 * @dev Mock ERC721 contract for testing purposes
 */
contract ERC721Mock is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    string private _baseTokenURI;

    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) Ownable(msg.sender) {
        _tokenIdCounter = 1;
    }

    /**
     * @dev Mint a new token to the specified address
     * @param to Address to mint the token to
     * @param tokenId Specific token ID to mint
     */
    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }

    /**
     * @dev Mint a new token with auto-incrementing ID
     * @param to Address to mint the token to
     * @return tokenId The ID of the minted token
     */
    function safeMint(address to) public returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(to, tokenId);
        return tokenId;
    }

    /**
     * @dev Batch mint tokens to the specified address
     * @param to Address to mint tokens to
     * @param amount Number of tokens to mint
     */
    function batchMint(address to, uint256 amount) public {
        for (uint256 i = 0; i < amount; i++) {
            safeMint(to);
        }
    }

    /**
     * @dev Set the base URI for token metadata
     * @param baseURI The base URI string
     */
    function setBaseURI(string memory baseURI) public onlyOwner {
        _baseTokenURI = baseURI;
    }

    /**
     * @dev Get the base URI for token metadata
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Get the current token ID counter
     */
    function getCurrentTokenId() public view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @dev Check if a token exists
     * @param tokenId Token ID to check
     */
    function exists(uint256 tokenId) public view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}