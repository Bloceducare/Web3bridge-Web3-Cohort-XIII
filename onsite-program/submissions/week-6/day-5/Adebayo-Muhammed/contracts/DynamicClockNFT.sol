// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract DynamicClockNFT is ERC721, Ownable {
    using Strings for uint256;
    
    uint256 private _tokenIdCounter;
    string private constant BACKGROUND_IMAGE = "data:image/png;base64,YOUR_BASE64_STRING_HERE";
    
    constructor() ERC721("Dynamic Clock", "CLOCK") Ownable(msg.sender) {}
    
    function mint() public payable {
        require(msg.value >= 0.001 ether, "Insufficient payment");
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(msg.sender, tokenId);
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        
        uint256 timestamp = block.timestamp;
        uint256 hourValue = (timestamp / 3600 + 1) % 24;
        uint256 minuteValue = (timestamp / 60) % 60;
        uint256 secondValue = timestamp % 60;

        uint256 hourAngle = (hourValue % 12) * 30 + (minuteValue / 2);
        uint256 minuteAngle = minuteValue * 6;
        uint256 secondAngle = secondValue * 6;
        
        string memory svg = string(abi.encodePacked(
            '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">',
            '<image href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI1NC4xOTQiIGhlaWdodD0iNjcuMzA1IiBzdHlsZT0ic2hhcGUtcmVuZGVyaW5nOmdlb21ldHJpY1ByZWNpc2lvbjt0ZXh0LXJlbmRlcmluZzpnZW9tZXRyaWNQcmVjaXNpb247aW1hZ2UtcmVuZGVyaW5nOm9wdGltaXplUXVhbGl0eTtmaWxsLXJ1bGU6ZXZlbm9kZDtjbGlwLXJ1bGU6ZXZlbm9kZCIgdmlld0JveD0iMCAwIDM0Ni4wOSA0MjkuODIiPjxwYXRoIGQ9Ik05LjYgMzg5LjE4Yy00LjQ3IDEyLjM0LTguMjggMjQuNzYtOS42IDQwLjYzaDM0Ni4xYzAtMjEuMDYtMS42LTU1LjUxLTE1LjM1LTcyLjM3LTIuNDUtNS4zLTExLjA4LTguNi0xOC45My0xMy4zNy00My41MS0yMy4zOC03Ny4zNC0yMi44MS02My41NS02Ni41MiAzLjU2LTExLjMuNjEtMjQuNyAxMy40NC0yNC4xMSAxNS43LjcxIDM4LjE4IDEwLjE5IDM0LjQ3LTE4LjA1LTEuMzUtMTAuMjQgMi42OS03LjU3IDYuNjYtMTMuNTEtNC41Mi0xOS40LjM3LTQuNDYgMS40LTE2Ljc1bC0xLjQtLjAxYy0xLjQyLTQuMjYtMi42Ny01LjU3LTIuNzktMTEuMTYgMjAuNjgtMTAuOTQgMTIuMjMtMTMuNDUgMi41Mi0yNy42My05Ljk1LTE0LjUyLTIuOTktMy40Ni05LjQ5LTE3LjAyIDEwLjYyLTcuMTEgNi4wOS0xMC44LjgyLTM1LjctMi44MS0xMy4yNi0xLjE4LTEwLjEzLTQuOTktMTMuMTVsMS4zOS0xLjRjMy44Ni01LjA4IDMuNTUtMi4yNCAzLjY1LTcuOGw1LjUyLTUwYzEuMy02LjkxIDQuNDktMTUuMTMgMS45OS0yMC4zNC0zLjI4IDIuNC00LjI2IDQuNDEtNS40OCAxMS4zMS0uNzEgMy45OS0xLjAxIDEuNzEtLjEgNS40My0uMjEtLjA4LTMuMjEtLjU4LTQuMTgtMS40IDAtOC44OCAyLjQ3LTE5Ljk3IDAtMjUuMTItNC4zOCAxLjU5LTguOCAxNS4zNi05Ljc3IDE5LjU0LTQuNDYtMi45OS0uOTgtMi4yOS02Ljk4LTIuNzktMy4xIDQuNjMtNS4yNyA5LjMyLTguMzcgMTMuOTYtNy40MS0zLjkyLTUuMzYtNC4yMi0xMC4wOC02Ljk4LTQuMTQtMTAuNDMtMS4zNC0yNi45LTEyLjI1LTM0Ljg5LTIuNjkgMS45Ny0xMy4yNyAxNi45Ni0xMy43NSAyMS4xNS0uOSA3LjcyIDMuNjYgNi4zMS0zLjY5IDExLjYtMTQuMzggMTAuMzUtMjIuNTUtMS42OS0zMS42LTEzLjAyLTQuNDYtNS41OS0xMS4yMy0xNi4xNy0xNi41NS0xOS43My0xLjI5IDIuNy0zLjg2IDguNzMtNC4xOSAxMi4xNC0zLjQgNS44Ni00Ljk0IDExLjQ3LTcuNzcgMTcuNzctMy4wMSA2LjctNi40NCAxMC41LTguOTkgMTYuMTQtNC4zOS0xLjA0LTMuNTggMS4zNC05LjM0LTguOC0yLjUzLTQuNDUtMy42LTcuOTUtOC44LTkuMzQtLjc3IDMuMjgtMS4zIDQuMTItMS40IDguMzctNi41OC00LjgyLTYuNDQtMTUuOS0xMy45Ni0yMC45MyAwIDkuMDIgNi4zOCAzMi4xNSA4LjIyIDQyLjAyIDEuNzggOS41Ni4yNyAxMS44OSA0LjM0IDE1LjM3LTEuNjkgNC4zLS45OSAxNy41MyAxLjQgMjMuMzUgMi40NCAyLjYzLTMuNDcgNC45MS03LjggMjAuMzEtNS4zMiAxOC45MS01LjQ5IDM2LjMgMy4xMyA1NC4zNCAxMy42NCAyOC41NSAyNS41IDM1LjI4IDIwLjQ0IDczLjg5bC00LjcgMjcuNEMxMzYuMDMgMzMyLjgzIDQ0LjAzIDI5NC4xNiA5LjYyIDM4OS4xN3oiIHN0eWxlPSJmaWxsOiM0MTQxNDYiLz48L3N2Zz4=" width="400" height="400" opacity="0.3"/>',
            '<rect width="400" height="400" fill="rgba(26,26,46,0.7)"/>',
            '<circle cx="200" cy="200" r="180" fill="#16213e" stroke="#0f3460" stroke-width="8"/>',
            '<text x="200" y="40" text-anchor="middle" fill="white" font-size="32">12</text>',
            '<text x="360" y="210" text-anchor="middle" fill="white" font-size="32">3</text>',
            '<text x="200" y="380" text-anchor="middle" fill="white" font-size="32">6</text>',
            '<text x="40" y="210" text-anchor="middle" fill="white" font-size="32">9</text>',
            '<line x1="200" y1="200" x2="200" y2="120" stroke="#ff6b6b" stroke-width="8" transform="rotate(',
            hourAngle.toString(), ' 200 200)"/>',
            '<line x1="200" y1="200" x2="200" y2="80" stroke="#4ecdc4" stroke-width="6" transform="rotate(',
            minuteAngle.toString(), ' 200 200)"/>',
            '<line x1="200" y1="200" x2="200" y2="60" stroke="#ffe66d" stroke-width="2" transform="rotate(',
            secondAngle.toString(), ' 200 200)"/>',
            '<circle cx="200" cy="200" r="12" fill="#ff6b6b"/>',
            '<text x="200" y="320" text-anchor="middle" fill="#4ecdc4" font-size="24">',
            formatTime(hourValue), ':', formatTime(minuteValue), ':', formatTime(secondValue),
            '</text></svg>'
        ));
        
        string memory json = Base64.encode(bytes(string(abi.encodePacked(
            '{"name":"Dynamic Clock #', tokenId.toString(), 
            '","description":"A blockchain clock that shows current time",',
            '"attributes":[',
                '{"trait_type":"Hour","value":"', hourValue.toString(), '"},',
                '{"trait_type":"Minute","value":"', minuteValue.toString(), '"},',
                '{"trait_type":"Second","value":"', secondValue.toString(), '"}',
            '],"image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '"}'
        ))));
        
        return string(abi.encodePacked("data:application/json;base64,", json));
    }
    
    function formatTime(uint256 time) private pure returns (string memory) {
        return time < 10 ? string(abi.encodePacked("0", time.toString())) : time.toString();
    }
    
    function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    function _exists(uint256 tokenId) internal view returns (bool) {
        return tokenId < _tokenIdCounter;
    }
}