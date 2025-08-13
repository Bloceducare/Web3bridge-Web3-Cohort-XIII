// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract RoleNFT is ERC721 {
    uint256 private _currentTokenId;

    constructor() ERC721("DAONFT", "DNFT") {}

    function mint(address to) external returns (uint256) {
        uint256 tokenId = _currentTokenId++;
        _mint(to, tokenId);
        return tokenId;
    }
}