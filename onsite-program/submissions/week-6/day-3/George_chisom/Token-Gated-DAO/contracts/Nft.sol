// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../libraries/Storage.sol";


contract Nft is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    mapping(address => bool) private _hasMinted;

    constructor(address initialOwner) ERC721("GEORGEDAO", "GEODO") Ownable(initialOwner) {
        _tokenIdCounter = 0;
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://ipfs.io/ipfs/bafkreihbk52ovoabxhd7gpxyn37bblxpah4c5cza2gqunojq5wjgy6urka";
    }

    function safeMint(string memory url) public returns (uint256) {

        uint256 tokenId = _tokenIdCounter++;

            _hasMinted[msg.sender] = true;
            _safeMint(msg.sender, tokenId);
            _setTokenURI(tokenId, url);
            return tokenId;
        
    }

    function mint(address to, string memory uri) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        return tokenId;
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    } 

    // function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
    //     super._burn(tokenId);
    // }
}