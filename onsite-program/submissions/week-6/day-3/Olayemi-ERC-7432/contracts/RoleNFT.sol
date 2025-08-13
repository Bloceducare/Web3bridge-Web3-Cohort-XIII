// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "./interfaces/IERC7432.sol";

contract RoleNFT is ERC721URIStorage, IERC7432 {
    mapping(uint256 => mapping(string => bool)) private _roles;

    constructor() ERC721("RoleNFT", "RNFT") {
    }
    

    function assignRole(uint256 tokenId, string memory role) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        _roles[tokenId][role] = true;
    }

    function hasRole(uint256 tokenId, string memory role) external view returns (bool) {
        return _roles[tokenId][role];
    }

    function mint(address to, uint256 tokenId, string memory uri) external {
        _mint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }
}
