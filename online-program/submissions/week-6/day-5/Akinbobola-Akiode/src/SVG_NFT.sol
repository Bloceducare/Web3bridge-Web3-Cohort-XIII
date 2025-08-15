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
        
        string memory svg = string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">',
            '<rect width="400" height="400" fill="#0f0f23"/>',
            '<circle cx="200" cy="200" r="180" fill="none" stroke="#4a9eff" stroke-width="4"/>',
            '<circle cx="200" cy="200" r="160" fill="none" stroke="#2d3748" stroke-width="2"/>',
            _drawClockHands(hh, mm, ss),
            '<text x="200" y="320" font-family="Arial, sans-serif" font-size="16" fill="#ffffff" text-anchor="middle">',
            hh, ":", mm, ":", ss, " UTC</text>",
            '<text x="200" y="340" font-family="Arial, sans-serif" font-size="12" fill="#718096" text-anchor="middle">Block: ',
            _toString(block.number), "</text>",
            '<text x="200" y="360" font-family="Arial, sans-serif" font-size="12" fill="#718096" text-anchor="middle">#',
            _toString(id), "</text></svg>"
        );
        
        string memory json = string.concat(
            '{"name":"SVG Clock #', _toString(id),
            '","description":"On-chain SVG clock displaying current time from block.timestamp","image":"data:image/svg+xml;base64,',
            Base64.encode(bytes(svg)), '"}'
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
    
    function _drawClockHands(string memory hh, string memory mm, string memory ss) internal pure returns (string memory) {
        uint256 hourAngle = (_parseInt(hh) % 12) * 30 + (_parseInt(mm) / 2);
        uint256 minuteAngle = _parseInt(mm) * 6;
        uint256 secondAngle = _parseInt(ss) * 6;
        
        string memory hourHand = string.concat(
            '<line x1="200" y1="200" x2="', _toString(uint256(int256(200) + int256(80) * _cos(hourAngle))), 
            '" y2="', _toString(uint256(int256(200) + int256(80) * _sin(hourAngle))), 
            '" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/>'
        );
        
        string memory minuteHand = string.concat(
            '<line x1="200" y1="200" x2="', _toString(uint256(int256(200) + int256(120) * _cos(minuteAngle))), 
            '" y2="', _toString(uint256(int256(200) + int256(120) * _sin(minuteAngle))), 
            '" stroke="#4a9eff" stroke-width="4" stroke-linecap="round"/>'
        );
        
        string memory secondHand = string.concat(
            '<line x1="200" y1="200" x2="', _toString(uint256(int256(200) + int256(140) * _cos(secondAngle))), 
            '" y2="', _toString(uint256(int256(200) + int256(140) * _sin(secondAngle))), 
            '" stroke="#ff6b6b" stroke-width="2" stroke-linecap="round"/>'
        );
        
        return string.concat(hourHand, minuteHand, secondHand);
    }
    
    function _cos(uint256 angle) internal pure returns (int256) {
        angle = angle % 360;
        int256 result;
        if (angle <= 90) result = 1;
        else if (angle <= 180) result = -1;
        else if (angle <= 270) result = -1;
        else result = 1;
        return result;
    }
    
    function _sin(uint256 angle) internal pure returns (int256) {
        angle = angle % 360;
        int256 result;
        if (angle <= 90) result = 1;
        else if (angle <= 180) result = 1;
        else if (angle <= 270) result = -1;
        else result = -1;
        return result;
    }
    
    function _parseInt(string memory str) internal pure returns (uint256) {
        bytes memory b = bytes(str);
        uint256 result = 0;
        for (uint256 i = 0; i < b.length; i++) {
            if (b[i] >= 0x30 && b[i] <= 0x39) {
                result = result * 10 + (uint256(uint8(b[i])) - 0x30);
            }
        }
        return result;
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

library Base64 {
    string internal constant TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    
    function encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";
        
        uint256 len = 4 * ((data.length + 2) / 3);
        string memory result = new string(len);
        
        bytes memory table = bytes(TABLE);
        
        assembly {
            let tablePtr := add(table, 32)
            let dataPtr := data
            let endPtr := add(dataPtr, mload(data))
            let resPtr := add(result, 32)
            
            for {} lt(dataPtr, endPtr) {}
            {
                dataPtr := add(dataPtr, 3)
                let input := mload(dataPtr)
                
                mstore8(resPtr, mload(add(tablePtr, and(shr(26, input), 0x3F))))
                mstore8(add(resPtr, 1), mload(add(tablePtr, and(shr(20, input), 0x3F))))
                mstore8(add(resPtr, 2), mload(add(tablePtr, and(shr(14, input), 0x3F))))
                mstore8(add(resPtr, 3), mload(add(tablePtr, and(shr(8, input), 0x3F))))
                
                resPtr := add(resPtr, 4)
            }
            
            switch mod(mload(data), 3)
            case 1 { mstore(sub(resPtr, 2), shl(240, 0x3d3d)) }
            case 2 { mstore(sub(resPtr, 1), shl(248, 0x3d)) }
        }
        
        return result;
    }
}