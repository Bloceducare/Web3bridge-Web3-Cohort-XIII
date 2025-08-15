// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NftCollection is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    address public minter;

    event MinterSet(address indexed minter);

    constructor(
        string memory name_,
        string memory symbol_
    ) ERC721(name_, symbol_) Ownable(msg.sender) {}

    function setMinter(address _minter) external onlyOwner {
        minter = _minter;
        emit MinterSet(_minter);
    }

    function mintTo(address to) external returns (uint256 tokenId) {
        require(msg.sender == minter, "NftCollection: only minter");
        tokenId = ++_tokenIdCounter;
        _safeMint(to, tokenId);
    }
}
