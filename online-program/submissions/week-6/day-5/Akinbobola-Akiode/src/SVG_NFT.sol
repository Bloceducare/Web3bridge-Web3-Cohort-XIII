// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SVG_NFT {
    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => address) public getApproved;
    mapping(address => mapping(address => bool)) public isApprovedForAll;
    uint256 public totalSupply;
    string public name = "SVG Clock";
    string public symbol = "SVGC";

    event Transfer(address indexed from, address indexed to, uint256 indexed id);
    event Approval(address indexed owner, address indexed spender, uint256 indexed id);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function supportsInterface(bytes4 iid) public pure returns (bool) {
        return iid == 0x80ac58cd || iid == 0x5b5e139f || iid == 0x01ffc9a7;
    }

    function mint(address to) external returns (uint256 id) {
        require(to != address(0));
        id = ++totalSupply;
        ownerOf[id] = to;
        balanceOf[to] += 1;
        emit Transfer(address(0), to, id);
    }

    function approve(address spender, uint256 id) external {
        address owner = ownerOf[id];
        require(msg.sender == owner || isApprovedForAll[owner][msg.sender]);
        getApproved[id] = spender;
        emit Approval(owner, spender, id);
    }

    function setApprovalForAll(address operator, bool approved) external {
        isApprovedForAll[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function transferFrom(address from, address to, uint256 id) public {
        address owner = ownerOf[id];
        require(owner == from && to != address(0));
        require(
            msg.sender == owner || msg.sender == getApproved[id] || isApprovedForAll[owner][msg.sender]
        );
        if (getApproved[id] != address(0)) getApproved[id] = address(0);
        balanceOf[from] -= 1;
        balanceOf[to] += 1;
        ownerOf[id] = to;
        emit Transfer(from, to, id);
    }

    function safeTransferFrom(address from, address to, uint256 id) external {
        transferFrom(from, to, id);
    }

    function safeTransferFrom(address from, address to, uint256 id, bytes calldata) external {
        transferFrom(from, to, id);
    }

    function tokenURI(uint256 id) external view returns (string memory) {
        require(ownerOf[id] != address(0));
        (string memory hh, string memory mm, string memory ss) = _getTimeParts(block.timestamp);
        
        // Create a clean, simple SVG that Rarible can handle
        string memory svg = string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">',
            '<rect width="300" height="300" fill="#000000"/>',
            '<circle cx="150" cy="150" r="120" fill="none" stroke="#ffffff" stroke-width="4"/>',
            '<text x="150" y="160" font-family="Arial, sans-serif" font-size="32" fill="#ffffff" text-anchor="middle">',
            hh, ":", mm, ":", ss, '</text>',
            '<text x="150" y="190" font-family="Arial, sans-serif" font-size="16" fill="#ffffff" text-anchor="middle">UTC Time</text>',
            '<text x="150" y="210" font-family="Arial, sans-serif" font-size="14" fill="#ffffff" text-anchor="middle">Block: ',
            _toString(block.number), '</text>',
            '<text x="150" y="230" font-family="Arial, sans-serif" font-size="14" fill="#ffffff" text-anchor="middle">Token #',
            _toString(id), '</text>',
            '</svg>'
        );
        
        // Use standard metadata format that Rarible expects
        string memory json = string.concat(
            '{"name":"SVG Clock #', _toString(id),
            '","description":"Dynamic clock NFT showing current UTC time from blockchain","image":"data:image/svg+xml;base64,',
            Base64.encode(bytes(svg)), '","external_url":"","attributes":[{"trait_type":"Time","value":"',
            hh, ":", mm, ":", ss, '"},{"trait_type":"Block","value":"',
            _toString(block.number), '"},{"trait_type":"Token ID","value":"',
            _toString(id), '"}]}'
        );
        
        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }
    
    function _getTimeParts(uint256 timestamp) internal pure returns (string memory hh, string memory mm, string memory ss) {
        uint256 secondsInDay = timestamp % 86400;
        uint256 hourValue = secondsInDay / 3600;
        uint256 minuteValue = (secondsInDay % 3600) / 60;
        uint256 secondValue = secondsInDay % 60;
        
        hh = _padZero(hourValue);
        mm = _padZero(minuteValue);
        ss = _padZero(secondValue);
    }
    
    function _padZero(uint256 num) internal pure returns (string memory) {
        if (num < 10) {
            return string.concat("0", _toString(num));
        }
        return _toString(num);
    }
    
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}

// Fixed Base64 library - no assembly bugs
library Base64 {
    string internal constant TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    
    function encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";
        
        uint256 len = 4 * ((data.length + 2) / 3);
        string memory result = new string(len);
        
        bytes memory table = bytes(TABLE);
        
        uint256 j = 0;
        for (uint256 i = 0; i < data.length;) {
            uint256 a = i < data.length ? uint8(data[i]) : 0;
            uint256 b = i + 1 < data.length ? uint8(data[i + 1]) : 0;
            uint256 c = i + 2 < data.length ? uint8(data[i + 2]) : 0;
            
            uint256 triple = (a << 16) + (b << 8) + c;
            
            bytes memory resultBytes = bytes(result);
            resultBytes[j] = table[(triple >> 18) & 63];
            resultBytes[j + 1] = table[(triple >> 12) & 63];
            resultBytes[j + 2] = table[(triple >> 6) & 63];
            resultBytes[j + 3] = table[triple & 63];
            
            i += 3;
            j += 4;
        }
        
        // Adjust for padding
        if (data.length % 3 == 1) {
            bytes memory resultBytes = bytes(result);
            resultBytes[j - 2] = "=";
            resultBytes[j - 1] = "=";
        } else if (data.length % 3 == 2) {
            bytes memory resultBytes = bytes(result);
            resultBytes[j - 1] = "=";
        }
        
        return result;
    }
}
