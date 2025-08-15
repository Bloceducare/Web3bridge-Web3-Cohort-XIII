// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract DynamicTimeNFT is ERC721 {
    using Strings for uint;
    uint256 private _tokenIdCounter = 1001;
    address private owner;
    constructor() ERC721("RAFIK TOKEN", "RAFIKK") {
      mint(msg.sender);
      owner = msg.sender;
    }

    function mint(address to) public {
        require(owner == msg.sender,"UNAUTHORISED");
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "NFT does not exist");

        uint256 timestamp = block.timestamp;

        (uint256 hrs, uint256 mins, uint256 secs) = _splitTimestamp(timestamp);

        string memory svg = string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">',
                '<rect width="100%" height="100%" fill="#121212"/>',
                '<text x="50%" y="40%" fill="#080700ff" font-family="Courier New, monospace" font-size="24" text-anchor="middle" dominant-baseline="middle">RAFIK</text>',
                '<text x="50%" y="50%" fill="#000000ff" font-family="Courier New, monospace, futura" font-size="32" text-anchor="middle" dominant-baseline="middle">',
                _formatTime(hrs, mins, secs),
                "</text>",
                '<text x="50%" y="60%" fill="#FFFFFF" font-family="Courier New, monospace" font-size="14" text-anchor="middle" dominant-baseline="middle"> ',
                Strings.toString(timestamp),
                "</text>",
                "</svg>"
            )
        );

        string memory svgBase64 = Base64.encode(bytes(svg));

        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "RAFIK TOKEN',
                        Strings.toString(tokenId),
                        '",',
                        '"description": "A Token for every RAFIK.",',
                        '"image": "data:image/svg+xml;base64,',
                        svgBase64,
                        '",',
                        '"attributes": [',
                        '{"trait_type": "Type", "value": "RAFIK"},',
                        '{"trait_type": "Timestamp", "value": "',
                        Strings.toString(timestamp),
                        '"},',
                        '{"trait_type": "Time", "value": "',
                        _formatTime(hrs, mins, secs),
                        '"},',
                        '{"trait_type": "Block Number", "value": "',
                        Strings.toString(block.number),
                        '"}',
                        "],",
                        '"external_url": "https://etherscan.io/token/',
                        Strings.toString(tokenId),
                        '",',
                        '"animation_url": "data:image/svg+xml;base64,',
                        svgBase64,
                        '"',
                        "}"
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function _splitTimestamp(
        uint256 timestamp
    ) private pure returns (uint256 h, uint256 m, uint256 s) {
        h = (timestamp / 3600) % 24;
        m = (timestamp / 60) % 60;
        s = timestamp % 60;
    }

    function _formatTime(
        uint256 h,
        uint256 m,
        uint256 s
    ) private pure returns (string memory) {
        return
            string(
                abi.encodePacked(
                    _twoDigits(h),
                    ":",
                    _twoDigits(m),
                    ":",
                    _twoDigits(s),
                    " UTC"
                )
            );
    }

    function _twoDigits(uint256 num) private pure returns (string memory) {
        return
            num < 10
                ? string(abi.encodePacked("0", Strings.toString(num)))
                : Strings.toString(num);
    }
}

