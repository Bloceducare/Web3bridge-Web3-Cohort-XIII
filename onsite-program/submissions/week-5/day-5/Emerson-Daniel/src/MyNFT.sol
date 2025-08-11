// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";
import "openzeppelin-contracts/contracts/utils/Counters.sol";

contract MyNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

    /// @notice Owner-only mint that sets tokenURI (ipfs://...)
    function mintTo(address to, string calldata tokenURI) external onlyOwner returns (uint256) {
        _tokenIds.increment();
        uint256 id = _tokenIds.current();
        _safeMint(to, id);
        _setTokenURI(id, tokenURI);
        return id;
    }
}
