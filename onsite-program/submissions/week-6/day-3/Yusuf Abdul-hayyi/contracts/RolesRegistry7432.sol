// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IERC7432.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RolesRegistry7432 is IERC7432, Ownable {

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
    return interfaceId == type(IERC7432).interfaceId || interfaceId == type(IERC165).interfaceId;
    }

    // token => tokenId => roleId => Role
    mapping(address => mapping(uint256 => mapping(bytes32 => Role)))
        private _roles;

    // approvals: tokenAddress => owner => operator => approved
    mapping(address => mapping(address => mapping(address => bool)))
        private _roleApprovals;

    // registrars who can grant roles on behalf of token owners (set by registry owner)
    mapping(address => bool) public registrars;

    event RegistrarSet(address indexed registrar, bool allowed);
    event RoleGranted(
        address indexed tokenAddress,
        uint256 indexed tokenId,
        address indexed recipient
    );

    modifier onlyOwnerOrRegistrar() {
        require(
            msg.sender == owner() || registrars[msg.sender],
            "RolesRegistry: not owner or registrar"
        );
        _;
    }

    constructor(address[] memory initialRegistrars) Ownable(msg.sender) {
        for (uint256 i = 0; i < initialRegistrars.length; i++) {
            registrars[initialRegistrars[i]] = true;
            emit RegistrarSet(initialRegistrars[i], true);
        }
    }

    // allow owner to add/remove registrars
    function setRegistrar(address registrar, bool allowed) external onlyOwner {
        registrars[registrar] = allowed;
        emit RegistrarSet(registrar, allowed);
    }

    function grantRole(Role calldata r) external override {
        // basic expiration check
        require(
            r.expirationDate == type(uint64).max ||
                uint256(r.expirationDate) > block.timestamp,
            "BAD_EXPIRATION"
        );

        // who is the token owner?
        address tokenOwner = IERC721(r.tokenAddress).ownerOf(r.tokenId);

        bool allowedAsOwner = (msg.sender == tokenOwner) ||
            _roleApprovals[r.tokenAddress][tokenOwner][msg.sender];
        bool allowedAsRegistrar = registrars[msg.sender];

        require(
            allowedAsOwner || allowedAsRegistrar,
            "NOT_AUTHORIZED_TO_GRANT"
        );

        // store role
        _roles[r.tokenAddress][r.tokenId][r.roleId] = Role({
            roleId: r.roleId,
            tokenAddress: r.tokenAddress,
            tokenId: r.tokenId,
            recipient: r.recipient,
            expirationDate: r.expirationDate,
            revocable: r.revocable,
            data: r.data
        });

        emit RoleGranted(r.tokenAddress, r.tokenId, r.recipient);
    }

    function revokeRole(
        address _tokenAddress,
        uint256 _tokenId,
        bytes32 _roleId
    ) external override {
        Role memory r = _roles[_tokenAddress][_tokenId][_roleId];
        require(r.tokenAddress != address(0), "ROLE_NOT_SET");

        address tokenOwner = IERC721(_tokenAddress).ownerOf(_tokenId);
        bool senderIsOwnerOrApproved = (msg.sender == tokenOwner) ||
            _roleApprovals[_tokenAddress][tokenOwner][msg.sender];
        bool senderIsRecipient = (msg.sender == r.recipient);

        if (r.revocable) {
            require(
                senderIsOwnerOrApproved || senderIsRecipient,
                "NOT_AUTHORIZED_TO_REVOKE"
            );
        } else {
            require(senderIsRecipient, "ONLY_RECIPIENT_CAN_REVOKE");
        }

        delete _roles[_tokenAddress][_tokenId][_roleId];
        emit RoleRevoked(_tokenAddress, _tokenId, _roleId);
    }

    function setRoleApprovalForAll(
        address _tokenAddress,
        address _operator,
        bool _approved
    ) external override {
        address ownerAddr = msg.sender;
        _roleApprovals[_tokenAddress][ownerAddr][_operator] = _approved;
        emit RoleApprovalForAll(_tokenAddress, _operator, _approved);
    }

    /* Views */

    function recipientOf(
        address _tokenAddress,
        uint256 _tokenId,
        bytes32 _roleId
    ) external view override returns (address) {
        return _roles[_tokenAddress][_tokenId][_roleId].recipient;
    }

    function roleExpirationDate(
        address _tokenAddress,
        uint256 _tokenId,
        bytes32 _roleId
    ) external view override returns (uint64) {
        return _roles[_tokenAddress][_tokenId][_roleId].expirationDate;
    }

    function hasActiveRole(
        address _tokenAddress,
        uint256 _tokenId,
        bytes32 _roleId,
        address account
    ) external view returns (bool) {
        Role memory r = _roles[_tokenAddress][_tokenId][_roleId];
        if (r.recipient != account) return false;
        if (
            r.expirationDate != type(uint64).max &&
            uint256(r.expirationDate) < block.timestamp
        ) return false;
        return true;
    }
}
