// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract TimeNFT is ERC721 {
    using Strings for uint;

    uint private _tokenIds;
    
    constructor() ERC721("TimeNFT", "TIME") {}

    function mint() public {
        _tokenIds += 1;
        _safeMint(msg.sender, _tokenIds);
    }

    function generateSVG() internal view returns (string memory) {
        string memory time = getCurrentTime();
        
        return string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">',
                '<rect width="300" height="300" fill="#121212"/>',
                '<text x="150" y="150" font-family="Arial" font-size="24" fill="white" text-anchor="middle">',
                time,
                '</text>',
                '</svg>'
            )
        );
    }
    
    function tokenURI(uint tokenId) public view override returns (string memory) {
        
        string memory svg = generateSVG();
        string memory json = Base64.encode(
            bytes(string(
                abi.encodePacked(
                    '{"name": "Time NFT #', tokenId.toString(), '",',
                    '"description": "An NFT that displays the current time",',
                    '"image": "data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '",',
                    '"attributes": [{"trait_type": "Time", "value": "', getCurrentTime(), '"}]',
                    '}'
                )
            ))
        );
        
        return string(abi.encodePacked('data:application/json;base64,', json));
    }
    
    function getCurrentTime() internal view returns (string memory) {
        uint timestamp = block.timestamp;

        uint hrs = (timestamp / 60 / 60) % 24;
        uint _minutes = (timestamp / 60) % 60;
        uint _seconds = timestamp % 60;
        
        return string(
            abi.encodePacked(
                hrs < 10 ? "0" : "", hrs.toString(), ":",
                _minutes < 10 ? "0" : "", _minutes.toString(), ":",
                _seconds < 10 ? "0" : "", _seconds.toString()
            )
        );
    }
}
