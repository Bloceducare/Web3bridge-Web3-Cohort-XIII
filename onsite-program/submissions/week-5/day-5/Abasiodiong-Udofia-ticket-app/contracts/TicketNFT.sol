// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TicketNFT is ERC721, Ownable {
    uint256 private nextTokenId;

    constructor(address _platform) ERC721("TicketNFT", "TNFT") Ownable(_platform) {}

    function mint(address _to) external onlyOwner returns (uint256) {
        uint256 tokenId = nextTokenId;
        _mint(_to, tokenId);
        nextTokenId++;
        return tokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "ERC721: URI query for nonexistent token");
        return string(abi.encodePacked("https://ticketing-platform.com/ticket/", uint2str(tokenId)));
    }

    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = uint8(48 + (_i % 10));
            bstr[k] = bytes1(temp);
            _i /= 10;
        }
        return string(bstr);
    }
}