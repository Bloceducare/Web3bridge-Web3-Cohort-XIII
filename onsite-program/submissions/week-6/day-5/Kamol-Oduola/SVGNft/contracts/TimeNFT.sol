// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract TimeNFT is ERC721Enumerable {
    using Strings for uint256;

    constructor() ERC721("Dynamic Time NFT", "DTNFT") {}

    function mint() public {
        uint256 tokenId = totalSupply() + 1;
        _safeMint(msg.sender, tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");

        uint256 currentTime = block.timestamp;

        uint256 hrs = (currentTime / 3600) % 24;
        uint256 mins = (currentTime / 60) % 60;
        uint256 secs = currentTime % 60;

        string memory timeString = string(
            abi.encodePacked(
                padZero(hrs), ":",
                padZero(mins), ":",
                padZero(secs)
            )
        );

        string memory svg = string(
            abi.encodePacked(
                "<svg xmlns='http://www.w3.org/2000/svg' width='350' height='350'>",
                "<rect width='100%' height='100%' fill='black'/>",
                "<text x='50%' y='50%' font-size='40' fill='white' text-anchor='middle'>",
                timeString,
                "</text></svg>"
            )
        );

        string memory imageData = string(
            abi.encodePacked(
                "data:image/svg+xml;base64,",
                Base64.encode(bytes(svg))
            )
        );

        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Dynamic Time NFT #', tokenId.toString(),
                        '", "description": "An on-chain NFT showing the current blockchain time.", "image": "', imageData, '"}'
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function padZero(uint256 number) internal pure returns (string memory) {
        return number < 10 ? string(abi.encodePacked("0", number.toString())) : number.toString();
    }
}
