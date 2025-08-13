// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./ERC7432.sol";

contract RoleNFT is ERC721, ERC7432, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    bytes32 public constant VOTER_ROLE = keccak256("VOTER_ROLE");
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");
    bytes32 public constant VETO_ROLE = keccak256("VETO_ROLE");

    mapping(uint256 => string) private _tokenURIs;
    mapping(bytes32 => mapping(uint256 => uint64)) private _roleExpirations;
    mapping(bytes32 => mapping(uint256 => bool)) private _roleAssigned;

    event TokenMinted(address indexed to, uint256 indexed tokenId);
    event BatchRoleGranted(bytes32 indexed role, uint256[] tokenIds, uint64 expiration);

    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) Ownable() {}

    function mint(
        address to,
        string memory _tokenURI,
        bytes32[] memory roles,
        uint64[] memory expirations
    ) external onlyOwner returns (uint256) {
        return _mintWithRoles(to, _tokenURI, roles, expirations);
    }

    // Fixed: Create an internal helper function that matches the expected parameters
    function _mintWithRoles(
        address to,
        string memory _tokenURI,
        bytes32[] memory roles,
        uint64[] memory expirations
    ) internal returns (uint256) {
        require(roles.length == expirations.length, "RoleNFT: roles and expirations length mismatch");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        // Grant initial roles
        for (uint256 i = 0; i < roles.length; i++) {
            _roleExpirations[roles[i]][tokenId] = expirations[i];
            _roleAssigned[roles[i]][tokenId] = true;
            emit RoleGranted(roles[i], tokenId, msg.sender);
        }

        emit TokenMinted(to, tokenId);
        return tokenId;
    }

    function batchMint(
        address[] memory recipients,
        string[] memory tokenURIs,
        bytes32[] memory roles,
        uint64[] memory expirations
    ) external onlyOwner {
        require(recipients.length == tokenURIs.length, "RoleNFT: recipients and URIs length mismatch");
        require(roles.length == expirations.length, "RoleNFT: roles and expirations length mismatch");

        for (uint256 i = 0; i < recipients.length; i++) {
            _mintWithRoles(recipients[i], tokenURIs[i], roles, expirations);
        }
    }

    function batchGrantRole(
        bytes32 role,
        uint256[] memory tokenIds,
        uint64 expiration
    ) external {
        require(
            hasRole(ROLE_ADMIN, msg.sender) || owner() == msg.sender,
            "RoleNFT: insufficient permission"
        );

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(_exists(tokenIds[i]), "RoleNFT: token does not exist");
            
            _roleExpirations[role][tokenIds[i]] = expiration;
            _roleAssigned[role][tokenIds[i]] = true;
            
            emit RoleGranted(role, tokenIds[i], msg.sender);
        }

        emit BatchRoleGranted(role, tokenIds, expiration);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(_exists(tokenId), "RoleNFT: URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }

    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal {
        require(_exists(tokenId), "RoleNFT: URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }

    function getActiveRoles(uint256 tokenId) external view returns (bytes32[] memory) {
        require(_exists(tokenId), "RoleNFT: query for nonexistent token");
        
        bytes32[] memory allRoles = getAllDefinedRoles();
        bytes32[] memory tempRoles = new bytes32[](allRoles.length);
        uint256 activeCount = 0;

        for (uint256 i = 0; i < allRoles.length; i++) {
            if (_hasValidRole(allRoles[i], tokenId)) {
                tempRoles[activeCount] = allRoles[i];
                activeCount++;
            }
        }

        bytes32[] memory activeRoles = new bytes32[](activeCount);
        for (uint256 i = 0; i < activeCount; i++) {
            activeRoles[i] = tempRoles[i];
        }

        return activeRoles;
    }

    function getAllDefinedRoles() public pure returns (bytes32[] memory) {
        bytes32[] memory roles = new bytes32[](5);
        roles[0] = VOTER_ROLE;
        roles[1] = PROPOSER_ROLE;
        roles[2] = ADMIN_ROLE;
        roles[3] = TREASURY_ROLE;
        roles[4] = VETO_ROLE;
        return roles;
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    function _isTokenOwner(uint256 tokenId, address account)
        internal
        view
        override
        returns (bool)
    {
        return ownerOf(tokenId) == account;
    }

    function _tokenExists(uint256 tokenId) internal view override returns (bool) {
        return _exists(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC7432)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}