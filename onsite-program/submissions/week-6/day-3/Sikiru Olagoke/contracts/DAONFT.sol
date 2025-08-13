// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.4.0
pragma solidity ^0.8.23;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract DAONFT is ERC721, ERC721URIStorage {
    constructor() ERC721("DAONFT", "DNFT") {}

    function _baseURI() internal pure override returns (string memory) {
        return "https://gateway.pinata.cloud/ipfs/bafybeif3gehfpmkm7igzs3fisgq6mruet3n7gg3gvwb7t5oxdmpo4khvam/";
    }

    function safeMint(address to, uint256 tokenId) public returns (uint256) {
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, "snackgang.png");
        return tokenId;
    }

    // The following functions are overrides required by Solidity.

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
