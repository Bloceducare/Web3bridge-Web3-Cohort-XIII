// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IERC7432.sol";

interface ITokenGatedDAO {
    function registerTokenOwnership(uint256 tokenId, address owner) external;
}

contract RoleNFT is ERC721, Ownable, IERC7432 {
    struct RoleData {
        uint64 expirationDate;
        bool revocable;
        bytes data;
    }

    mapping(bytes32 => mapping(uint256 => mapping(address => RoleData))) private _roles;
    uint256 private _tokenIdCounter;
    address public daoContract;

    constructor() ERC721("DAO Role NFT", "DRNFT") Ownable(msg.sender) {}

    function setDAOContract(address _daoContract) external onlyOwner {
        daoContract = _daoContract;
    }

    function mint(address to) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        _mint(to, tokenId);

        // Register token ownership with DAO contract
        if (daoContract != address(0)) {
            ITokenGatedDAO(daoContract).registerTokenOwnership(tokenId, to);
        }

        return tokenId;
    }

    // Override transfer functions to update DAO contract
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address previousOwner = super._update(to, tokenId, auth);

        // Register new ownership with DAO contract
        if (daoContract != address(0) && to != address(0)) {
            ITokenGatedDAO(daoContract).registerTokenOwnership(tokenId, to);
        }

        return previousOwner;
    }

    function grantRole(
        bytes32 role,
        uint256 tokenId,
        address account,
        uint64 expirationDate,
        bool revocable,
        bytes calldata data
    ) external override {
        require(_exists(tokenId), "Token does not exist");
        require(account != address(0), "Cannot grant role to zero address");
        require(expirationDate > block.timestamp, "Expiration date must be in the future");
        require(ownerOf(tokenId) == msg.sender || owner() == msg.sender, "Not authorized");

        // Additional security: For most use cases, roles should be granted to token owner
        // Allow contract owner to grant roles to any address for administrative purposes
        if (msg.sender != owner()) {
            require(account == ownerOf(tokenId), "Can only grant role to token owner");
        }

        _roles[role][tokenId][account] = RoleData(expirationDate, revocable, data);
        emit RoleGranted(role, tokenId, account, expirationDate, revocable, data);
    }

    function revokeRole(bytes32 role, uint256 tokenId, address account) external override {
        require(_exists(tokenId), "Token does not exist");

        RoleData memory roleInfo = _roles[role][tokenId][account];
        require(roleInfo.expirationDate > 0, "Role does not exist");

        // Authorization check: token owner, contract owner, or if role is revocable
        bool isAuthorized = (ownerOf(tokenId) == msg.sender) ||
                           (owner() == msg.sender) ||
                           (roleInfo.revocable && account == msg.sender);

        require(isAuthorized, "Not authorized to revoke");

        delete _roles[role][tokenId][account];
        emit RoleRevoked(role, tokenId, account);
    }

    function hasRole(bytes32 role, uint256 tokenId, address account) external view override returns (bool) {
        if (!_exists(tokenId)) return false;
        RoleData memory roleInfo = _roles[role][tokenId][account];
        return roleInfo.expirationDate > block.timestamp;
    }

    function roleExpirationDate(bytes32 role, uint256 tokenId, address account) external view override returns (uint64) {
        return _roles[role][tokenId][account].expirationDate;
    }

    function isRoleRevocable(bytes32 role, uint256 tokenId, address account) external view override returns (bool) {
        return _roles[role][tokenId][account].revocable;
    }

    function roleData(bytes32 role, uint256 tokenId, address account) external view override returns (bytes memory) {
        return _roles[role][tokenId][account].data;
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return tokenId < _tokenIdCounter;
    }
}