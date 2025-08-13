// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;


import "./interfaces/IERC721.sol";
import "./interfaces/IERC165.sol";
import "./interfaces/IERC7432.sol";

contract DAONFT is IERC721, IERC165 {
    string public name;
    string public symbol;
    uint256 private _tokenIdCounter;
    
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    
    IERC7432 public rolesRegistry;
    
    constructor(string memory _name, string memory _symbol, address _rolesRegistry) {
        name = _name;
        symbol = _symbol;
        rolesRegistry = IERC7432(_rolesRegistry);
    }
    
    function mint(address to) external {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _balances[to]++;
        _owners[tokenId] = to;
        
        emit Transfer(address(0), to, tokenId);
    }
    
    function balanceOf(address owner) external view override returns (uint256) {
        require(owner != address(0), "ERC721: balance query for zero address");
        return _balances[owner];
    }
    
    function ownerOf(uint256 tokenId) external view override returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "ERC721: owner query for nonexistent token");
        return owner;
    }
    
    function approve(address to, uint256 tokenId) external override {
        address owner = _owners[tokenId];
        require(to != owner, "ERC721: approval to current owner");
        require(msg.sender == owner || isApprovedForAll(owner, msg.sender), "ERC721: approve caller is not owner nor approved for all");
        
        _tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }
    
    function getApproved(uint256 tokenId) external view override returns (address) {
        require(_owners[tokenId] != address(0), "ERC721: approved query for nonexistent token");
        return _tokenApprovals[tokenId];
    }
    
    function setApprovalForAll(address operator, bool approved) external override {
        require(operator != msg.sender, "ERC721: approve to caller");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }
    
    function isApprovedForAll(address owner, address operator) public view override returns (bool) {
        return _operatorApprovals[owner][operator];
    }
    
    function transferFrom(address from, address to, uint256 tokenId) external override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: transfer caller is not owner nor approved");
        require(from == _owners[tokenId], "ERC721: transfer from incorrect owner");
        require(to != address(0), "ERC721: transfer to the zero address");
        
        _balances[from]--;
        _balances[to]++;
        _owners[tokenId] = to;
        
        delete _tokenApprovals[tokenId];
        
        emit Transfer(from, to, tokenId);
    }
    
    function safeTransferFrom(address from, address to, uint256 tokenId) external override {
        safeTransferFrom(from, to, tokenId, "");
    }
    
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: transfer caller is not owner nor approved");
        require(from == _owners[tokenId], "ERC721: transfer from incorrect owner");
        require(to != address(0), "ERC721: transfer to the zero address");
        
        _balances[from]--;
        _balances[to]++;
        _owners[tokenId] = to;
        
        delete _tokenApprovals[tokenId];
        
        emit Transfer(from, to, tokenId);
        
        require(_checkOnERC721Received(from, to, tokenId, data), "ERC721: transfer to non ERC721Receiver implementer");
    }
    
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address owner = _owners[tokenId];
        return (spender == owner || _tokenApprovals[tokenId] == spender || _operatorApprovals[owner][spender]);
    }
    
    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory data) internal returns (bool) {
        if (to.code.length > 0) {
            try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (bytes4 retval) {
                return retval == IERC721Receiver.onERC721Received.selector;
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert("ERC721: transfer to non ERC721Receiver implementer");
                } else {
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        } else {
            return true;
        }
    }
    
    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return interfaceId == type(IERC721).interfaceId || interfaceId == type(IERC165).interfaceId;
    }
}

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
} 