// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC7432.sol";


 
contract DAOMembershipNFT is ERC721, ERC721Enumerable, Ownable, ERC7432 {
    uint256 private _tokenIdCounter;

    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VOTER_ROLE = keccak256("VOTER_ROLE");
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    mapping(uint256 => string) private _tokenURIs;

    constructor() ERC721("DAO Membership", "DAOMEMBER") Ownable(msg.sender) {}

   
    function mintMembership(address to, string memory uri) external onlyOwner {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    
    function setTokenURI(uint256 tokenId, string memory uri) external onlyOwner {
        require(_exists(tokenId), "DAOMembershipNFT: URI set of nonexistent token");
        _setTokenURI(tokenId, uri);
    }

    
    function _setTokenURI(uint256 tokenId, string memory uri) internal {
        _tokenURIs[tokenId] = uri;
    }

    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "DAOMembershipNFT: URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }

    
    function grantDAORole(
        bytes32 role,
        uint256 tokenId,
        address account,
        uint64 expirationDate
    ) external onlyOwner {
        require(
            role == ADMIN_ROLE || 
            role == VOTER_ROLE || 
            role == PROPOSER_ROLE || 
            role == EXECUTOR_ROLE,
            "DAOMembershipNFT: Invalid DAO role"
        );
        require(_exists(tokenId), "DAOMembershipNFT: role grant for nonexistent token");
        require(account != address(0), "DAOMembershipNFT: grant role to zero address");
        
        _grantRole(role, tokenId, account, expirationDate, "");
    }

    
    function _ownerOf(uint256 tokenId) internal view override(ERC721, ERC7432) returns (address) {
        return super._ownerOf(tokenId);
    }

    function _exists(uint256 tokenId) internal view override returns (bool) {
        return tokenId < _tokenIdCounter;
    }

    function _isApproved(address owner, address operator) internal view override returns (bool) {
        return isApprovedForAll(owner, operator);
    }

    
    function _increaseBalance(address account, uint128 amount) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, amount);
    }

    function _update(address to, uint256 tokenId, address auth) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC7432)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
