// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";



contract TimeNft is ERC721,Ownable{
    using Strings for uint256;

    uint256 private _IDCounter;

    constructor() ERC721("Time", "TMN") Ownable(msg.sender){}

     function mint(address to) public {
        uint256 tokenID = _IDCounter;
        _IDCounter++;
        _safeMint(to, tokenID);

     }



  function _pad2(uint256 x) internal pure returns (string memory) {
        if (x >= 10) return x.toString();
        return string(abi.encodePacked("0", x.toString()));
    }

function _buildSVG() internal view returns (string memory) {
        uint256 ts = block.timestamp;

        // Derive HH:MM:SS from seconds since midnight (UTC) for a clean clock display
        uint256 secsInDay = ts % 86400;
        uint256 hh = secsInDay / 3600;
        uint256 mm = (secsInDay % 3600) / 60;
        uint256 ss = secsInDay % 60;

        string memory timeStr = string(
            abi.encodePacked(_pad2(hh), ":", _pad2(mm), ":", _pad2(ss), " UTC")
        );

        // Simple, legible SVG (black background, centered monospace time)
        return string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">',
                  '<defs>',
                    '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">',
                      '<stop offset="0%" stop-color="#111"/>',
                      '<stop offset="100%" stop-color="#222"/>',
                    '</linearGradient>',
                  '</defs>',
                  '<rect width="100%" height="100%" fill="url(#g)"/>',
                  '<circle cx="512" cy="512" r="420" fill="#000" fill-opacity="0.35"/>',
                  '<text x="50%" y="46%" text-anchor="middle" dominant-baseline="middle" ',
                        'font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" ',
                        'font-size="120" fill="#EDEDED">On-Chain Clock</text>',
                  '<text x="50%" y="58%" text-anchor="middle" dominant-baseline="middle" ',
                        'font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" ',
                        'font-size="180" fill="#00E5FF">', timeStr, '</text>',
                  
                '</svg>'
            )
        );
    }
      function tokenURI(uint256 tokenId) public view override returns (string memory) {
        // require(_existsFlag[tokenId], "Nonexistent token");

        // Build dynamic SVG and wrap as data:image/svg+xml;base64
        string memory svg = _buildSVG();
        string memory imageData = string(
            abi.encodePacked("data:image/svg+xml;base64,", Base64.encode(bytes(svg)))
        );
        // string memory imageData = "ipfs://bafkreiavet5ifca5xslziehzpx7gzst72zcdpeyfjbljn5m6aeqzochngq";

        // Metadata JSON (also fully on-chain)
        bytes memory json = abi.encodePacked(
            "{",
                '"name":"OnChainClock #', tokenId.toString(), '",',
                '"description":"An on-chain SVG clock whose image shows the current time derived from block.timestamp whenever tokenURI() is queried.",',
                '"image":"', imageData, '",',
                '"attributes":[',
                    '{"trait_type":"Dynamic","value":"Yes"},',
                    '{"trait_type":"Clock Source","value":"block.timestamp"},',
                    '{"trait_type":"Format","value":"HH:MM:SS UTC"}',
                "]",
            "}"
        );

        return string(
            abi.encodePacked("data:application/json;base64,", Base64.encode(json))
        );
    }
}