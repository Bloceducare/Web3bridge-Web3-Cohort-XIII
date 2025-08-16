// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SVGNFT is ERC721, Ownable {
    using Strings for uint256;

    uint256 private _tokenIdCounter;
    mapping(uint256 => address) private _owners;

    event TokenMinted(uint256 indexed tokenId, address indexed to);

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) Ownable(msg.sender) {}

    function mint() external returns (uint256 tokenId) {
        require(msg.sender != address(0), "Invalid recipient");
        tokenId = ++_tokenIdCounter;
        _owners[tokenId] = msg.sender;
        _safeMint(msg.sender, tokenId);
        emit TokenMinted(tokenId, msg.sender);
        return tokenId;
    }

    function totalMinted() external view returns (uint256) {
        return _tokenIdCounter;
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _owners[tokenId] != address(0);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Nonexistent token");

        string memory svg = _generateSVG(tokenId);

        bytes memory json = abi.encodePacked(
            '{',
                '"name":"Timestamp SVG NFT #', tokenId.toString(), '",',
                '"description":"An on-chain SVG that displays the current block.timestamp in UTC at render time.",',
                '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '",',
                '"attributes":[{"trait_type":"Time Zone","value":"UTC"}]',
            '}'
        );

        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(json)
            )
        );
    }

    function formatHHMMSSFromTimestamp(uint256 ts) internal pure returns (string memory) {
        uint256 secsInDay = ts % 86400;
        uint256 h = secsInDay / 3600;
        uint256 m = (secsInDay % 3600) / 60;
        uint256 s = secsInDay % 60;
        
        return string(abi.encodePacked(
            h < 10 ? "0" : "", Strings.toString(h), ":",
            m < 10 ? "0" : "", Strings.toString(m), ":",
            s < 10 ? "0" : "", Strings.toString(s)
        ));
    }

    function _generateSVG(uint256 tokenId) internal view returns (string memory) {
        string memory ts = formatHHMMSSFromTimestamp(block.timestamp);

        return string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480">',
                    '<defs>',
                        '<style>',
                            'text{font-family:Arial,sans-serif;fill:#ffffff;font-weight:bold;}',
                            '.title{fill:#00ff88;font-size:24px;}',
                            '.clock{fill:#ffffff;font-size:20px;stroke:#00ff88;stroke-width:2;}',
                            'rect{fill:#111111;}',
                        '</style>',
                    '</defs>',
                    '<rect width="100%" height="100%"/>',
                    '<g text-anchor="middle">',
                        '<text x="50%" y="40%" class="title">Timestamp NFT</text>',
                        '<text x="50%" y="48%" font-size="18">Token #', tokenId.toString(), '</text>',
                        '<text x="50%" y="60%" font-size="16">Time (UTC):</text>',
                        '<text x="50%" y="68%" font-size="20" class="clock">', ts, '</text>',
                    '</g>',
                '</svg>'
            )
        );
    }
}