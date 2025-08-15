// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MembershipNFT is ERC721, ERC721Enumerable, Ownable {
    uint256 private _tokenIdTracker;

    // Your Pinata IPFS metadata link
    string private constant TOKEN_URI =
        "https://coffee-urgent-owl-462.mypinata.cloud/ipfs/bafkreifq4lhld3ttipg3r7c72hbareqqjmw7chws3rblsftuhew3of44rm";

    constructor() ERC721("Amas DAO", "AMDO") Ownable(msg.sender) {}

    function mint(address to) external onlyOwner returns (uint256) {
        _tokenIdTracker++;
        _safeMint(to, _tokenIdTracker);
        return _tokenIdTracker;
    }

    // Return the same metadata URI for all tokens (your use case)
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721)
        returns (string memory)
    {
        require(_ownerOf(tokenId) != address(0), "ERC721: nonexistent token");
        return TOKEN_URI;
    }

    // ===== Required overrides for ERC721 + ERC721Enumerable (OZ v5) =====
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }
}
