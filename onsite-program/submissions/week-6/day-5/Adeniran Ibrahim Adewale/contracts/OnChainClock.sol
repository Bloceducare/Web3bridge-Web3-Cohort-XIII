// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {Base64} from "./Base64.sol";

contract OnChainClock is ERC721URIStorage, Ownable {
    event Minted(uint256 tokenId);

    using Strings for uint256;
    uint256 private _tokenIds;

    // using Counters for Counters.Counter;
    // Counters.Counter private _tokenIds;

    constructor() ERC721("TimeOnChainNFT", "TOC") Ownable(msg.sender) {}

    /* Generates an SVG with current time based on block.timestamp */
    function generateSVG(uint256 timestamp) public pure returns (string memory) {
        // Convert timestamp to hrs, mins, secs
        uint256 hrs = (timestamp / 3600) % 24;
        uint256 mins = (timestamp / 60) % 60;
        uint256 secs = timestamp % 60;

        // Format time as HH:MM:SS
        string memory timeStr = string(abi.encodePacked(
            Strings.toString(hrs < 10 ? 0 : hrs/10),
            Strings.toString(hrs % 10),
            ":",
            Strings.toString(mins < 10 ? 0 : mins/10),
            Strings.toString(mins % 10),
            ":",
            Strings.toString(secs < 10 ? 0 : secs/10),
            Strings.toString(secs % 10)
        ));

        // Create SVG with time display
        return string(abi.encodePacked(
            '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">',
            '<rect width="100%" height="100%" fill="#000000"/>',
            '<text x="50%" y="50%" font-family="Arial" font-size="48" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">',
            timeStr,
            '</text>',
            '</svg>'
        ));
    }

    /* Converts an SVG to Base64 string */
    function svgToImageURI(string memory svg) public pure returns (string memory) {
        string memory baseURL = "data:image/svg+xml;base64,";
        string memory svgBase64Encoded = Base64.encode(bytes(svg));
        return string(abi.encodePacked(baseURL, svgBase64Encoded));
    }

    /* Generates a tokenURI using Base64 string as the image */
    function formatTokenURI(string memory imageURI) public pure returns (string memory) {
        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(
                    bytes(
                        abi.encodePacked(
                            '{"name": "TIME ON-CHAINED", ',
                            '"description": "An on-chain NFT displaying the current time based on block.timestamp", ',
                            '"image":"', imageURI, '"}'
                        )
                    )
                )
            )
        );
    }

    /* Mints the token with current timestamp */
    function mint() public onlyOwner {
        string memory svg = generateSVG(block.timestamp);
        string memory imageURI = svgToImageURI(svg);
        string memory tokenMetadata = formatTokenURI(imageURI);

        _tokenIds++;
        uint256 newItemId = _tokenIds;

        _safeMint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenMetadata);

        emit Minted(newItemId);
    }

    /* Override tokenURI to dynamically generate SVG with current timestamp */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(tokenId != 0, "ERC721URIStorage: URI query for nonexistent token");
        
        string memory svg = generateSVG(block.timestamp);
        string memory imageURI = svgToImageURI(svg);
        return formatTokenURI(imageURI);
    }
}