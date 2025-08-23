// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract TimeNFT is ERC721, Ownable {
    using Strings for uint256;

    uint256 private _tokenIdCounter;

    constructor() ERC721("TimeNFT", "TIME") Ownable(msg.sender) {}

    function mint(address to) public onlyOwner {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(to, tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");

        string memory svg = generateSVG();
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name":"Time #',
                        tokenId.toString(),
                        '","description":"Dynamic time NFT","image":"data:image/svg+xml;base64,',
                        Base64.encode(bytes(svg)),
                        '"}'
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function generateSVG() internal view returns (string memory) {
        uint256 timestamp = block.timestamp;

        uint256 timeHours = (timestamp / 3600) % 24;
        uint256 timeMinutes = (timestamp / 60) % 60;
        uint256 timeSeconds = timestamp % 60;

        string memory timeString = string(
            abi.encodePacked(
                padZero(timeHours),
                ":",
                padZero(timeMinutes),
                ":",
                padZero(timeSeconds)
            )
        );

        return string(
            abi.encodePacked(
                '<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">',
                '<rect width="300" height="200" fill="#111"/>',
                '<text x="150" y="60" text-anchor="middle" fill="#fff" font-family="monospace" font-size="16">TIME NFT</text>',
                '<text x="150" y="100" text-anchor="middle" fill="#0ff" font-family="monospace" font-size="24">',
                timeString,
                '</text>',
                '<text x="150" y="140" text-anchor="middle" fill="#888" font-family="monospace" font-size="12">Block ',
                block.number.toString(),
                '</text>',
                '</svg>'
            )
        );
    }

    function padZero(uint256 value) internal pure returns (string memory) {
        if (value < 10) {
            return string(abi.encodePacked("0", value.toString()));
        }
        return value.toString();
    }
}
