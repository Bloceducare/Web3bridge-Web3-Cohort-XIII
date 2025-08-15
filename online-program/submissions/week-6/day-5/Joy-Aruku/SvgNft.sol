// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract SvgNfT is ERC721 {
    using Strings for uint256;

    uint256 private _tokenIdCounter;
    mapping(uint256 => address) private _owners;

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

    function mint(address to) external returns (uint256 tokenId) {
        tokenId = ++_tokenIdCounter;
        _safeMint(to, tokenId);
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
            "{",
                "\"name\":\"Timestamp SVG NFT #", tokenId.toString(), "\",",
                "\"description\":\"An on-chain SVG that displays the current block.timestamp at render time.\",",
                "\"image\":\"data:image/svg+xml;base64,", Base64.encode(bytes(svg)), "\"",
            "}"
        );

        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(json)
            )
        );
    }



    function _generateSVG(uint256 tokenId) internal view returns (string memory) {
        string memory ts = block.timestamp.toString();

        return string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480">',
                    '<rect width="100%" height="100%" fill="#111111"/>',
                    '<g font-family="monospace" fill="#ffffff">',
                        '<text x="50%" y="42%" font-size="20" text-anchor="middle">Timestamp NFT</text>',
                        '<text x="50%" y="50%" font-size="16" text-anchor="middle">Token #', tokenId.toString(), '</text>',
                        '<text x="50%" y="60%" font-size="14" text-anchor="middle">block.timestamp:</text>',
                        '<text x="50%" y="68%" font-size="14" text-anchor="middle">', ts, '</text>',
                    '</g>',
                '</svg>'
            )
        );
    }
}
