// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract ClockSVG is ERC721URIStorage, Ownable {
    using Strings for uint256;

    uint256 public totalMinted;

    constructor() ERC721("On-Chain Clock", "OCC") Ownable(msg.sender) {}

    function mint(address to) external onlyOwner returns (uint256 tokenId) {
        tokenId = ++totalMinted;
        _safeMint(to, tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");

        uint256 ts = block.timestamp;
        (string memory bg, string memory fg) = _palette(tokenId);

        string memory svg = _svg(tokenId, ts, bg, fg);
        string memory image = _imageDataURI(svg);

        string memory json = _json(tokenId, ts, image);

        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(bytes(json))
            )
        );
    }


    function _svg(
        uint256 tokenId,
        uint256 ts,
        string memory bg,
        string memory fg
    ) internal pure returns (string memory) {
        (uint256 hh, uint256 mm, uint256 ss) = _hms(ts);
        string memory clock = string(
            abi.encodePacked(_two(hh), ":", _two(mm), ":", _two(ss), " UTC")
        );

        return string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="512" viewBox="0 0 1024 512">',
                    "<defs>",
                        '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">',
                            '<stop offset="0%" stop-color="', bg, '"/>',
                            '<stop offset="100%" stop-color="#000000"/>',
                        "</linearGradient>",
                    "</defs>",
                    '<rect width="100%" height="100%" fill="url(#g)"/>',
                    '<g font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" text-anchor="middle">',
                        '<text x="512" y="260" font-size="120" fill="', fg, '" dominant-baseline="middle">', clock, "</text>",
                        '<text x="512" y="340" font-size="28" fill="', fg, '" opacity="0.75">block.timestamp = ',
                            ts.toString(),
                        "</text>",
                        '<text x="512" y="380" font-size="20" fill="', fg, '" opacity="0.6">Token #',
                            tokenId.toString(),
                        " - On-Chain Clock</text>",
                    "</g>",
                "</svg>"
            )
        );
    }

    function _imageDataURI(string memory svg) internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                "data:image/svg+xml;base64,",
                Base64.encode(bytes(svg))
            )
        );
    }

    function _json(
        uint256 tokenId,
        uint256 ts,
        string memory image
    ) internal pure returns (string memory) {
        (uint256 hh, uint256 mm, uint256 ss) = _hms(ts);

        return string(
            abi.encodePacked(
                "{",
                    '"name":"On-Chain Clock #', tokenId.toString(), '",',
                    '"description":"Fully on-chain SVG clock; the displayed time comes from block.timestamp (UTC) each time tokenURI() is queried.",',
                    '"image":"', image, '",',
                    '"attributes":[',
                        '{"trait_type":"Hours","value":"', _two(hh), '"},',
                        '{"trait_type":"Minutes","value":"', _two(mm), '"},',
                        '{"trait_type":"Seconds","value":"', _two(ss), '"},',
                        '{"trait_type":"Block Timestamp","value":"', ts.toString(), '"}',
                    "]",
                "}"
            )
        );
    }

    function _hms(uint256 ts) internal pure returns (uint256 hh, uint256 mm, uint256 ss) {
        uint256 day = 24 * 60 * 60;
        uint256 s = ts % day;
        hh = s / 3600;
        mm = (s % 3600) / 60;
        ss = s % 60;
    }

    function _two(uint256 v) internal pure returns (string memory) {
        if (v < 10) {
            return string(abi.encodePacked("0", v.toString()));
        }
        return v.toString();
    }

    function _palette(uint256 tokenId) internal pure returns (string memory bg, string memory fg) {
        bytes32 h = keccak256(abi.encodePacked(tokenId));
        uint256 hue = uint8(h[0]);
        string[12] memory colors = [
            "#0ea5e9", "#14b8a6", "#22c55e", "#84cc16",
            "#eab308", "#f59e0b", "#f97316", "#ef4444",
            "#ec4899", "#a855f7", "#6366f1", "#06b6d4"
        ];
        bg = colors[hue % colors.length];
        fg = "#ffffff";
    }
}

