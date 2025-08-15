// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IERC7432.sol";

contract InstitutionStaffNFT is ERC721, IERC7432, Ownable {
    // 0-based auto-incrementing token id tracker
    uint256 private _tokenIdTracker;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MENTOR_ROLE = keccak256("MENTOR_ROLE");
    bytes32 public constant NONE_TEACHING_ROLE = keccak256("NONE_TEACHING_ROLE");
    bytes32 public constant NON_ACADEMIC_ROLE = keccak256("NON_ACADEMIC_ROLE");

    struct RoleData {
        uint64 expirationDate;
        bool revocable;
        bytes data;
        bool exists;
    }

    // role => tokenId => account => RoleData
    mapping(bytes32 => mapping(uint256 => mapping(address => RoleData))) private _roles;

    // tokenId => account => roles[]
    mapping(uint256 => mapping(address => bytes32[])) private _accountRoles;

    event StaffNFTMinted(address indexed to, uint256 indexed tokenId, string staffType);

    // OZ v5 Ownable takes initial owner
    constructor() ERC721("Institution Staff NFT", "STAFF") Ownable(msg.sender) {}

    function mintStaff(address to, string calldata staffType) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdTracker; // starts at 0
        _tokenIdTracker += 1;
        _safeMint(to, tokenId);
        emit StaffNFTMinted(to, tokenId, staffType);
        return tokenId;
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
        require(msg.sender == owner() || msg.sender == ownerOf(tokenId), "Not authorized");
        require(
            role == ADMIN_ROLE || role == MENTOR_ROLE || role == NON_ACADEMIC_ROLE,
            "Invalid role"
        );

        _roles[role][tokenId][account] = RoleData({
            expirationDate: expirationDate,
            revocable: revocable,
            data: data,
            exists: true
        });

        bytes32[] storage accountRoles = _accountRoles[tokenId][account];
        bool roleExists;
        for (uint256 i = 0; i < accountRoles.length; i++) {
            if (accountRoles[i] == role) { roleExists = true; break; }
        }
        if (!roleExists) accountRoles.push(role);

        emit RoleGranted(role, tokenId, account, expirationDate, revocable, data);
    }

    function revokeRole(
        bytes32 role,
        uint256 tokenId,
        address account
    ) external override {
        require(_exists(tokenId), "Token does not exist");
        RoleData memory rd = _roles[role][tokenId][account];
        require(rd.exists, "Role does not exist");
        require(rd.revocable, "Role not revocable");
        require(msg.sender == owner() || msg.sender == ownerOf(tokenId), "Not authorized");

        delete _roles[role][tokenId][account];

        bytes32[] storage accountRoles = _accountRoles[tokenId][account];
        for (uint256 i = 0; i < accountRoles.length; i++) {
            if (accountRoles[i] == role) {
                accountRoles[i] = accountRoles[accountRoles.length - 1];
                accountRoles.pop();
                break;
            }
        }

        emit RoleRevoked(role, tokenId, account);
    }

    function hasRole(
        bytes32 role,
        uint256 tokenId,
        address account
    ) public view override returns (bool) {
        RoleData memory r = _roles[role][tokenId][account];
        if (!r.exists) return false;
        if (r.expirationDate > 0 && block.timestamp > r.expirationDate) return false;
        return true;
    }

    function roleExpirationDate(
        bytes32 role,
        uint256 tokenId,
        address account
    ) external view override returns (uint64) {
        return _roles[role][tokenId][account].expirationDate;
    }

    function isRoleRevocable(
        bytes32 role,
        uint256 tokenId,
        address account
    ) external view override returns (bool) {
        return _roles[role][tokenId][account].revocable;
    }

    function roleData(
        bytes32 role,
        uint256 tokenId,
        address account
    ) external view override returns (bytes memory) {
        return _roles[role][tokenId][account].data;
    }

    // Public so canVote can call internally without external call
    function isAdmin(address account) public view returns (bool) {
        uint256 maxId = _tokenIdTracker; // tokens are 0..maxId-1
        for (uint256 i = 0; i < maxId; i++) {
            // ownerOf(i) is safe because we mint sequentially and never burn
            if (ownerOf(i) == account && hasRole(ADMIN_ROLE, i, account)) return true;
        }
        return false;
    }

    function isMentor(address account) public view returns (bool) {
        uint256 maxId = _tokenIdTracker;
        for (uint256 i = 0; i < maxId; i++) {
            if (ownerOf(i) == account && hasRole(MENTOR_ROLE, i, account)) return true;
        }
        return false;
    }

    function canVote(address account) external view returns (bool) {
        return isAdmin(account) || isMentor(account);
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIdTracker;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721)
        returns (bool)
    {
        return interfaceId == type(IERC7432).interfaceId || super.supportsInterface(interfaceId);
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
    return _ownerOf(tokenId) != address(0);
}

}
