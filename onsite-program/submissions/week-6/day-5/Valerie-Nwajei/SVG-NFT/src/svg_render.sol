// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Render is ERC721, Ownable {
    using Strings for uint256;
    uint256 private _tokenCounter;

    constructor() ERC721("Val NFT", "VNFT") Ownable(msg.sender) {}

    function mint(address to) public onlyOwner {
        uint256 tokenId = _tokenCounter;
        _tokenCounter++;
        _safeMint(to, tokenId);
    }

    function renderSVG() external view returns (string memory) {
        uint256 currentTimestamp = block.timestamp;

        string memory svg = string(
            abi.encodePacked(
                '<svg width="250" height="100" xmlns="http://www.w3.org/2000/svg">',
                '<rect width="250" height="100" fill="#1a1a2e" stroke="#000" stroke-width="2"/>',
                '<text x="125" y="40" fill="white" text-anchor="middle" font-family="monospace" font-size="14">',
                "Timestamp:",
                "</text>",
                '<text x="125" y="65" fill="white" text-anchor="middle" font-family="monospace" font-size="16" font-weight="bold">',
                currentTimestamp.toString(),
                "</text>",
                "</svg>"
            )
        );
        return svg;
    }

    function generateSVG(
        uint256 tokenId
    ) internal view returns (string memory) {
        uint256 currentTimestamp = block.timestamp;

        string memory svg = string(
            abi.encodePacked(
                '<svg width="250" height="100" xmlns="http://www.w3.org/2000/svg">',
                '<rect width="250" height="100" fill="#1a1a2e" stroke="#000" stroke-width="2"/>',
                '<text x="125" y="40" fill="white" text-anchor="middle" font-family="monospace" font-size="14">',
                "Token #",
                tokenId.toString(),
                "</text>",
                '<text x="125" y="65" fill="white" text-anchor="middle" font-family="monospace" font-size="16" font-weight="bold">',
                currentTimestamp.toString(),
                "</text>",
                "</svg>"
            )
        );
        return svg;
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");

        string memory svg = generateSVG(tokenId);
        string memory name = string(
            abi.encodePacked("Val NFT #", tokenId.toString())
        );

        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "',
                        name,
                        '",',
                        '"description": "A fully on-chain generative NFT with dynamic timestamp",',
                        '"image": "data:image/svg+xml;base64,',
                        Base64.encode(bytes(svg)),
                        '",',
                        '"attributes": [',
                        '{"trait_type": "Timestamp", "value": "',
                        block.timestamp.toString(),
                        '"},',
                        '{"trait_type": "Token ID", "value": "',
                        tokenId.toString(),
                        '"}',
                        "]}"
                    )
                )
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function totalSupply() public view returns (uint256) {
        return _tokenCounter;
    }
}
