// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/// @notice Minimal ERC721 wrapper that supports minting + tokenURI setting.
/// Uses OpenZeppelin's ERC721URIStorage to keep _setTokenURI functionality.

import "openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";
import "openzeppelin-contracts/contracts/utils/Counters.sol";


contract TicketNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {
        
    }

    function _mintTicket(address to, string memory tokenURI_) internal returns (uint256) {
        _tokenIds.increment();
        uint256 newId = _tokenIds.current();
        _safeMint(to, newId);
        _setTokenURI(newId, tokenURI_);
        return newId;
    }

    function currentId() public view returns (uint256) {
        return _tokenIds.current();
    }
}
