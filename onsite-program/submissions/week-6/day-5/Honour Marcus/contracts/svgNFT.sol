// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

contract DynamicTimeSvgNFT is ERC721, Ownable {
    using Strings for uint256;

    uint256 private _nextTokenId = 1;

    constructor() ERC721("Dynamic Time SVG", "DTIME") Ownable(msg.sender) {}

    function mint(address to) external onlyOwner returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");

        uint256 ts = block.timestamp;
        (uint256 hh, uint256 mm, uint256 ss) = _hms(ts);

        string memory hhStr = _two(hh);
        string memory mmStr = _two(mm);
        string memory ssStr = _two(ss);

        string memory svg = string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400">',
                '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">',
                '<stop offset="0%" stop-color="#0ea5e9"/>',
                '<stop offset="100%" stop-color="#22c55e"/>',
                '</linearGradient></defs>',
                '<rect width="100%" height="100%" fill="url(#g)"/>',
                '<g font-family="monospace" fill="#ffffff" text-anchor="middle">',
                '<text x="400" y="180" font-size="88" font-weight="700">',
                hhStr, ':', mmStr, ':', ssStr,
                '</text>',
                '<text x="400" y="230" font-size="22" opacity="0.9">UTC time</text>',
                '<text x="400" y="300" font-size="18" opacity="0.9">Unix: ', ts.toString(), '</text>',
                '<text x="400" y="335" font-size="14" opacity="0.7">Token #', tokenId.toString(), '</text>',
                '</g></svg>'
            )
        );

        string memory imageData = string(
            abi.encodePacked(
                "data:image/svg+xml;base64,",
                Base64.encode(bytes(svg))
            )
        );

        bytes memory jsonBytes = abi.encodePacked(
            '{',
            '"name":"Dynamic Time SVG #', tokenId.toString(), '",',
            '"description":"On-chain SVG clock that shows current UTC time from block.timestamp.",',
            '"image":"', imageData, '",',
            '"attributes":[',
            '{"trait_type":"Unix Timestamp","value":', ts.toString(), '},',
            '{"trait_type":"Hours (UTC)","value":', hh.toString(), '},',
            '{"trait_type":"Minutes","value":', mm.toString(), '},',
            '{"trait_type":"Seconds","value":', ss.toString(), '}',
            ']',
            '}'
        );

        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(jsonBytes)
            )
        );
    }

    function _hms(uint256 t) internal pure returns (uint256 h, uint256 m, uint256 s) {
        uint256 daySeconds = t % 86400;
        h = daySeconds / 3600;
        m = (daySeconds % 3600) / 60;
        s = daySeconds % 60;
    }

    function _two(uint256 x) internal pure returns (string memory) {
        if (x >= 100) return x.toString();
        bytes memory buf = bytes(x.toString());
        if (buf.length == 1) {
            return string(abi.encodePacked("0", buf));
        }
        return string(buf);
    }
}
