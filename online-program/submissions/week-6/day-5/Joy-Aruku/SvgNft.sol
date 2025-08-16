// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract JoyDynamicNFT is ERC721 {
    using Strings for uint256;

    uint256 private _tokenIdCounter;
    mapping(uint256 => address) private owners;

    string private constant IMAGE_CID = "bafkreih4fecurt5zm2czxvse6dfubmuoxu5bri567tha22pwldsk3ajxua";

    constructor() ERC721("Joy NFT", "JOY") {}

    
    function mint(address to) external returns (uint256 tokenId) {
        tokenId = ++_tokenIdCounter;
        _safeMint(to, tokenId);
    }

    function totalMinted() external view returns (uint256) {
        return _tokenIdCounter;
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
    return owners[tokenId] != address(0);
}

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Nonexistent token");

        string memory svg = _generateSVG(tokenId);

        bytes memory json = abi.encodePacked(
            "{",
                "\"name\":\"Joy NFT #", tokenId.toString(), "\",",
                "\"description\":\"A unique Joy NFT with dynamic timestamp overlay.\",",
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
                '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500">',
                  
                    '<image href="ipfs://', IMAGE_CID, '" width="500" height="500"/>',

                    '<rect x="0" y="440" width="500" height="60" fill="black" opacity="0.6"/>',
                     "<text x='10' y='20' fill='white'>Token ID: ",
                            tokenId,
                            "</text>",
                    '<text x="50%" y="470" font-family="monospace" font-size="18" fill="white" text-anchor="middle">',
                        "block.timestamp: ", ts,
                    '</text>',
                '</svg>'
            )
        );
    }
}
