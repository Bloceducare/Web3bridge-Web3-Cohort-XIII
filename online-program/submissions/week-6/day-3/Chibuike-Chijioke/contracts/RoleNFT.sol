// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IRoleInterfaces.sol";

contract RoleNFT is ERC721, Ownable, IERC7432 {

    uint256 private _tokenIdCounter;

    struct RoleData {
        uint64 expiration;
        bool active;
    }

    mapping(uint256 => mapping(bytes32 => mapping(address => RoleData))) private _roles;
    mapping(uint256 => mapping(bytes32 => address[])) private _roleRecipients;


    bytes32 public constant PROPOSER = keccak256("PROPOSER");
    bytes32 public constant VOTER = keccak256("VOTER");
    bytes32 public constant EXECUTOR = keccak256("EXECUTOR");

    constructor() ERC721("RoleNFT", "RLNFT") Ownable(msg.sender) {}

    function mint(address to) external returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _mint(to, tokenId); // This emits the Transfer event
        _tokenIdCounter++;
        return tokenId;
    }

    function grantRole(uint256 tokenId, bytes32 role, address recipient, uint64 expirationDate) external override onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _roles[tokenId][role][recipient] = RoleData(expirationDate, true);
        _roleRecipients[tokenId][role].push(recipient);
        emit RoleGranted(tokenId, role, recipient, expirationDate);
    }

    function revokeRole(uint256 tokenId, bytes32 role, address recipient) external override onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        delete _roles[tokenId][role][recipient];
        emit RoleRevoked(tokenId, role, recipient);
    }

    function hasRole(uint256 tokenId, bytes32 role, address recipient) public view override returns (bool) {
        RoleData memory data = _roles[tokenId][role][recipient];
        return data.active && data.expiration > block.timestamp;
    }

    function roleExpirationDate(uint256 tokenId, bytes32 role, address recipient) external view override returns (uint64) {
        return _roles[tokenId][role][recipient].expiration;
    }

    function getRoleRecipients(uint256 tokenId, bytes32 role) external view override returns (address[] memory) {
        return _roleRecipients[tokenId][role];
    }

    event RoleGranted(uint256 indexed tokenId, bytes32 indexed role, address indexed recipient, uint64 expirationDate);
    event RoleRevoked(uint256 indexed tokenId, bytes32 indexed role, address indexed recipient);

}