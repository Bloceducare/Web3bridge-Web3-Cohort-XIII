// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DynamicTimeSVG is ERC721, Ownable {
    using Strings for uint256;

    uint256 private _nextId = 1;
    uint256 public price = 0.01 ether;

    constructor() ERC721("Martins Dynamic Time NFT", "MDTNFT") {
        _transferOwnership(msg.sender);
    }

    function setPrice(uint256 newPrice) external onlyOwner {
        price = newPrice;
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function mint() external payable returns (uint256 tokenId) {
        require(msg.value >= price, "Insufficient payment");
        tokenId = _nextId++;
        _safeMint(msg.sender, tokenId);

        uint256 excess = msg.value - price;
        if (excess > 0) {
            payable(msg.sender).transfer(excess);
        }
    }


    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireMinted(tokenId);
        (uint256 hh, uint256 mm, uint256 ss) = _hms(block.timestamp);
        string memory iso = _iso8601(block.timestamp);

        string memory svg = string.concat(
            "<svg xmlns='http://www.w3.org/2000/svg' width='1024' height='512' viewBox='0 0 1024 512'>",
            "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>",
            "<stop offset='0%' stop-color='#0f172a'/><stop offset='100%' stop-color='#111827'/>",
            "</linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/>",
            "<g font-family='monospace' text-anchor='middle'>",
            "<text x='512' y='240' font-size='160' fill='#e5e7eb'>", _pad2(hh), ":", _pad2(mm), ":", _pad2(ss), "</text>",
            unicode"<text x='512' y='300' font-size='24' fill='#93c5fd'>UTC · block.timestamp</text>",
            "<text x='512' y='340' font-size='18' fill='#9ca3af'>", iso, "</text>",
            "</g>",
            "<circle cx='100' cy='412' r='6'><animate attributeName='r' values='6;10;6' dur='2s' repeatCount='indefinite'/></circle>",
            "<text x='118' y='418' font-size='14' fill='#9ca3af' font-family='monospace'>Live-rendered on tokenURI()</text>",
            "</svg>"
        );

        string memory json = string.concat(
            "{",
            "\"name\":\"Dynamic Time #", tokenId.toString(), "\",",
            "\"description\":\"On-chain SVG showing current UTC time from block.timestamp on every query.\",",
            "\"attributes\":[",
            "{ \"trait_type\":\"Render\",\"value\":\"Dynamic\"},",
            "{ \"trait_type\":\"Timezone\",\"value\":\"UTC\"},",
            "{ \"trait_type\":\"Hours\",\"value\":\"", _pad2(hh), "\"},",
            "{ \"trait_type\":\"Minutes\",\"value\":\"", _pad2(mm), "\"},",
            "{ \"trait_type\":\"Seconds\",\"value\":\"", _pad2(ss), "\"}",
            "],",
            "\"image\":\"data:image/svg+xml;base64,", Base64.encode(bytes(svg)), "\"",
            "}"
        );

        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    function _hms(uint256 ts) internal pure returns (uint256 hh, uint256 mm, uint256 ss) {
        uint256 daySeconds = ts % 86400;
        hh = daySeconds / 3600;
        mm = (daySeconds % 3600) / 60;
        ss = daySeconds % 60;
    }

    function _pad2(uint256 v) internal pure returns (string memory) {
        return v >= 10 ? v.toString() : string.concat("0", v.toString());
    }

    function _iso8601(uint256 ts) internal pure returns (string memory) {
        (uint256 year, uint256 month, uint256 day) = _ymd(ts);
        (uint256 hh, uint256 mm, uint256 ss) = _hms(ts);
        return string.concat(
            Strings.toString(year), "-", _pad2(month), "-", _pad2(day),
            "T", _pad2(hh), ":", _pad2(mm), ":", _pad2(ss), "Z"
        );
    }

    function _ymd(uint256 ts) internal pure returns (uint256 year, uint256 month, uint256 day) {
        uint256 z = ts / 86400 + 719468;
        uint256 era = z / 146097;
        uint256 doe = z - era * 146097;
        uint256 yoe = (doe - doe/1460 + doe/36524 - doe/146096) / 365;
        uint256 doy = doe - (365*yoe + yoe/4 - yoe/100 + yoe/400);
        uint256 mp = (5*doy + 2) / 153;
        day = doy - (153*mp + 2)/5 + 1;
        int256 m = int256(mp) + (mp < 10 ? int256(3) : int256(-9));
        month = uint256(m);
        year = yoe + era * 400 + (month <= 2 ? 1 : 0);
    }
}
