// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "../Interfaces/IERC721.sol";

contract CustomNFT is IERC721 {
    
    string public name = "AMAS NFT";
    string public symbol = "AMS";
    uint256 private _tokenIdCounter;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    mapping(uint256 => string) private _tokenURIs;

    modifier onlyOwnerOrApproved(uint256 tokenId) {
        require(
            msg.sender == _owners[tokenId] || 
            msg.sender == _tokenApprovals[tokenId] || 
            _operatorApprovals[_owners[tokenId]][msg.sender],
            "Not authorized"
        );
        _;
    }

    constructor() {
        _tokenIdCounter = 0;
    }

    function balanceOf(address owner) external view override returns (uint256) {
        require(owner != address(0), "Invalid address");
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) external view override returns (address) {
        require(_exists(tokenId), "Token does not exist");
        return _owners[tokenId];
    }

    function safeMint(address to, string memory uri) public {
        require(to != address(0), "Invalid address");
        uint256 tokenId = _tokenIdCounter++;
        _owners[tokenId] = to;
        _balances[to]++;
        _tokenURIs[tokenId] = uri;
        emit Transfer(address(0), to, tokenId);
    }

    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return _tokenURIs[tokenId];
    }

    function approve(address to, uint256 tokenId) external override {
        require(_exists(tokenId), "Token does not exist");
        require(msg.sender == _owners[tokenId], "Not token owner");
        _tokenApprovals[tokenId] = to;
        emit Approval(msg.sender, to, tokenId);
    }

    function getApproved(uint256 tokenId) external view override returns (address) {
        require(_exists(tokenId), "Token does not exist");
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) external override {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address owner, address operator) external view override returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) external override onlyOwnerOrApproved(tokenId) {
        require(_exists(tokenId), "Token does not exist");
        require(_owners[tokenId] == from, "Invalid from address");
        require(to != address(0), "Invalid to address");
        
        _tokenApprovals[tokenId] = address(0);
        _balances[from]--;
        _balances[to]++;
        _owners[tokenId] = to;
        emit Transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external override onlyOwnerOrApproved(tokenId) {
        _safeTransfer(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external override onlyOwnerOrApproved(tokenId) {
        _safeTransfer(from, to, tokenId, data);
    }

    function _safeTransfer(address from, address to, uint256 tokenId, bytes memory data) internal {
        require(_exists(tokenId), "Token does not exist");
        require(_owners[tokenId] == from, "Invalid from address");
        require(to != address(0), "Invalid to address");
        
        _tokenApprovals[tokenId] = address(0);
        _balances[from]--;
        _balances[to]++;
        _owners[tokenId] = to;
        emit Transfer(from, to, tokenId);

        // Check if recipient is a contract and supports ERC721
        if (_isContract(to)) {
            try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (bytes4 retval) {
                require(retval == IERC721Receiver.onERC721Received.selector, "Recipient rejected");
            } catch {
                revert("Recipient not compatible");
            }
        }
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _owners[tokenId] != address(0);
    }

    function _isContract(address addr) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(addr)
        }
        return size > 0;
    }
}

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}