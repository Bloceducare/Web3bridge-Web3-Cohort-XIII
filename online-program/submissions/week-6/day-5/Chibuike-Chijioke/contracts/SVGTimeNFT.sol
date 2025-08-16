// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "./libraries/Base64.sol";
import "./libraries/Strings.sol";
import "./MinimalERC721.sol";


contract SVGTimeNFT is MinimalERC721, StringsContract, Base64Contract {
    address public contractOwner;
    uint256 private _nextTokenId;

    string public description = "On-chain SVG NFT that displays current time from block.timestamp";

    event Minted(address indexed to, uint256 indexed tokenId);
    event TokenViewed(address indexed viewer, uint256 indexed tokenId, uint256 timestamp);

    constructor() MinimalERC721("SVGTimeNFT", "SVGT") {
        contractOwner = msg.sender;
        _nextTokenId = 1;
    }

    modifier onlyOwner() {
        require(msg.sender == contractOwner, "only owner");
        _;
    }

    function mintTo(address to) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);
        emit Minted(to, tokenId);
        return tokenId;
    }

    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(_owners[tokenId] != address(0), "token not minted");

        uint256 secsInDay = block.timestamp % 86400;
        uint256 hh = secsInDay / 3600;
        uint256 mm = (secsInDay % 3600) / 60;
        uint256 ss = secsInDay % 60;

        string memory timeStr = string(
            abi.encodePacked(
                twoDigitString(hh),
                ":",
                twoDigitString(mm),
                ":",
                twoDigitString(ss)
            )
        );

        string memory svg = string(
            abi.encodePacked(
                "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'>",
                "<rect width='100%' height='100%' fill='#0b0b0b'/>",
                "<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' style='font-family:monospace; font-size:48px; fill:#ffffff'>",
                timeStr,
                "</text>",
                "<text x='50%' y='85%' dominant-baseline='middle' text-anchor='middle' style='font-family:Arial; font-size:14px; fill:#888'>On-chain time (block.timestamp)</text>",
                "</svg>"
            )
        );

        string memory image = string(abi.encodePacked("data:image/svg+xml;base64,", encode(bytes(svg))));

        string memory json = string(
            abi.encodePacked(
                '{"name":"SVG Time #',
                toString(tokenId),
                '", "description":"',
                description,
                '", "image":"',
                image,
                '"}'
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", encode(bytes(json))));
    }

    function recordView(uint256 tokenId) external {
        require(_owners[tokenId] != address(0), "token not minted");
        emit TokenViewed(msg.sender, tokenId, block.timestamp);
    }

    function setDescription(string calldata d) external onlyOwner {
        description = d;
    }
}