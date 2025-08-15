// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.4.0
pragma solidity ^0.8.27;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract DynamicNFT is ERC721, ERC721URIStorage, Ownable {
   uint256 private _nextTokenId;

    constructor()
        ERC721("DynamicNFT", "DNFT")
        Ownable(msg.sender)
    {
      _safeMint(msg.sender, _nextTokenId);
       _setTokenURI(_nextTokenId, construct_image(_nextTokenId));
      _nextTokenId++;
    }

    function safeMint(address to)
        public
        onlyOwner
    {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
         _setTokenURI(tokenId, construct_image(tokenId));

    }

    function get_time() internal view returns(string memory) {
      uint256 time = block.timestamp;
      uint256 second = 86400;
      uint256 currentTime = time % second;

      uint256 hour = currentTime / 3600;
      uint256 minute = (currentTime % 3600) / 60;
      uint256 timeInSecond = currentTime % 60;

      string memory timeString = string(abi.encodePacked(
        hour < 10 ? "0" : "", Strings.toString(hour), ":",
        minute < 10 ? "0" : "", Strings.toString(minute), ":",
        timeInSecond < 10 ? "0" : "", Strings.toString(timeInSecond)
      ));

      return timeString; 
    }

    // The following functions are overrides required by Solidity.

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return construct_image(tokenId);
    }

    //construct the svg to be minted
    function construct_image(uint256 id) internal view returns (string memory) {

      
         string memory currentTime = "";
        // Don't include stream in URI until token is minted
        if (id < 0) {
            // Get current time
            currentTime = string(
                abi.encodePacked(
                    unicode'<text x="20" y="305">Current Time: ',
                    get_time(),
                    "</text>"
                )
            );
        }

      bytes memory svgImage = abi.encodePacked(
            "data:image/svg+xml;base64,",
            Base64.encode(
                bytes(
                    abi.encodePacked(
                        '<?xml version="1.0" encoding="UTF-8"?>',
                        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">',
                        '<style type="text/css"><![CDATA[text { font-family: monospace; font-size: 20px;} .h1 {font-size: 20px; font-weight: 600;}]]></style>',
                        '<rect width="400" height="400" fill="#ffffff" />',
                        '<text class="h1" x="50" y="70">Show the current time</text>',
                        unicode'<text x="150" y="200" style="font-size:100px;">⏰</text>',
                        unicode'<text x="10" y="305" style="font-size:25px; font-weight:bold">Current Time: ',
                        get_time(),
                        "</text>",
                        "</svg>"
                    )
                )
            )
        );

        return string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"0xdothis Dynamic NFT", "image":"',
                                svgImage,
                                unicode'", "description": "A dynamic SVG reflecting current time"}'
                            )
                        )
                    )
                )
            );
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
