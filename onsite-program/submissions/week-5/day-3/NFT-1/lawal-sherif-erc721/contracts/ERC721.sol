// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IERC721 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function tokenURI(uint256 _tokenId) external view returns (string memory);
    function balanceOf(address _owner) external view returns (uint256);
    function ownerOf(uint256 _tokenId) external view returns (address);
    // function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes data) external payable;
    // function safeTransferFrom(address _from, address _to, uint256 _tokenId) external payable;
    function transferFrom(address _from, address _to, uint256 _tokenId) external payable;
    function approve(address _approved, uint256 _tokenId) external payable;
    function setApprovalForAll(address _operator, bool _approved) external;
    function getApproved(uint256 _tokenId) external view returns (address);
    function isApprovedForAll(address _owner, address _operator) external view returns (bool);
    function mint(address _to) external returns (uint256);
}

contract ERC721 is IERC721 {
    // Events (required by ERC721 standard)
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    string public name;
    string public symbol;

    uint256 token_count; //1,2,3,4,5,6
    mapping(uint256 => address) public owners; //1 => 0x1, 2 => 0x1, 3 => 0x1, 4 => 0x2 
    mapping(address => uint256) public balances; // 7,3,8,9,2 (0x1 => 5)
    mapping(uint256 => address) public approved;
    mapping(address => mapping(address => bool)) is_approved_for_all;

    string public constant baseURL = "https://bronze-ready-tarsier-679.mypinata.cloud/ipfs/";

    constructor (string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }

    // Check if token exists
    modifier tokenExists(uint256 _tokenId) {
        require(owners[_tokenId] != address(0), "Token does not exist");
        _;
    }

    function balanceOf(address _owner) external view returns (uint256) {
        require(_owner != address(0), "Query for zero address");
        return balances[_owner];
    }

    function ownerOf(uint256 _tokenId) external view tokenExists(_tokenId) returns (address) {
        return owners[_tokenId];
    }

    function approve(address _approved, uint256 _tokenId) external payable tokenExists(_tokenId) {
        address owner = owners[_tokenId];
        require(msg.sender == owner || is_approved_for_all[owner][msg.sender], "UNAUTHORIZED");
        require(_approved != owner, "Cannot approve yourself");
        
        approved[_tokenId] = _approved;
        emit Approval(owner, _approved, _tokenId);
    }

    function getApproved(uint256 _tokenId) external view tokenExists(_tokenId) returns (address) {
        return approved[_tokenId];
    }

    function setApprovalForAll(address _operator, bool _approved) external {
        require(_operator != msg.sender, "Cannot approve yourself");
        is_approved_for_all[msg.sender][_operator] = _approved;
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }

    function isApprovedForAll(address _owner, address _operator) external view returns (bool) {
        return is_approved_for_all[_owner][_operator];
    }

    function transferFrom(address _from, address _to, uint256 _tokenId) external payable tokenExists(_tokenId) {
        require(_to != address(0), "ADDRESS ZERO NOT ALLOWED");
        require(_from != address(0), "ADDRESS ZERO NOT ALLOWED");
        require(owners[_tokenId] == _from, "Invalid Owner");
        
        // Check authorization
        bool isAuthorized = (msg.sender == _from) || 
                           (approved[_tokenId] == msg.sender) || 
                           (is_approved_for_all[_from][msg.sender]);
        
        require(isAuthorized, "UNAUTHORIZED");
        
        // Update ownership and balances
        owners[_tokenId] = _to;
        balances[_from] -= 1;
        balances[_to] += 1;
        
        // Clear approval
        if (approved[_tokenId] != address(0)) {
            approved[_tokenId] = address(0);
        }
        
        emit Transfer(_from, _to, _tokenId);
    }

    // Implementation of missing tokenURI function
    function tokenURI(uint256 _tokenId) external view tokenExists(_tokenId) returns (string memory) {
        // For single NFT, return the specific metadata CID
        require(_tokenId == 1, "Only token 1 exists");
        return string(abi.encodePacked(baseURL, "bafkreieqj32al62pkcvdhazlpkqrp67ycf57wnv75unlwz23a5cn4sjilm"));
    }

    // Implementation of missing mint function
    function mint(address _to) external returns (uint256) {
        require(_to != address(0), "Cannot mint to zero address");
        
        token_count += 1;
        uint256 newTokenId = token_count;
        
        owners[newTokenId] = _to;
        balances[_to] += 1;
        
        emit Transfer(address(0), _to, newTokenId);
        
        return newTokenId;
    }

    // Helper function to convert uint to string
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
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