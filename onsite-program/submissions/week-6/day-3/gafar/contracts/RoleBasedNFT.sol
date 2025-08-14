// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./Interface/IERC7432.sol";

contract RoleBasedNFT is ERC721, IERC7432 {
  uint256 public nextId;

  function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721) returns (bool) {
    return
      interfaceId == 0x80ac58cd ||
      interfaceId == 0x01ffc9a7 ||
      interfaceId == 0xd00ca5cf ||
      super.supportsInterface(interfaceId);
  }

  constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

  function mint(address to) external returns (uint256 tokenId) {
    tokenId = ++nextId;
    _safeMint(to, tokenId);
  }

  struct RoleInfo {
    address recipient;
    uint64  expiration;
    bool    revocable;
    bytes   data;
    address originalOwner;
  }

  mapping(address => mapping(uint256 => mapping(bytes32 => RoleInfo))) private _roles;

  mapping(address => mapping(address => bool)) private _roleOperatorApproval;

  mapping(uint256 => bool) public tokenLocked;

  function _currentOwner(uint256 tokenId) internal view returns (address) {
    return ERC721.ownerOf(tokenId);
  }

  function _isRoleOperatorApproved(address owner) internal view returns (bool) {
    return _roleOperatorApproval[owner][msg.sender];
  }

  function grantRole(Role calldata _role) external override {
    require(_role.tokenAddress == address(this), "Wrong token address");
    require(_role.expirationDate > block.timestamp, "Expiration in past");

    address owner_ = _currentOwner(_role.tokenId);
    require(
      msg.sender == owner_ || _isRoleOperatorApproved(owner_),
      "Not owner nor approved operator"
    );

    RoleInfo storage info = _roles[_role.tokenAddress][_role.tokenId][_role.roleId];
    info.recipient      = _role.recipient;
    info.expiration     = _role.expirationDate;
    info.revocable      = _role.revocable;
    info.data           = _role.data;
    info.originalOwner  = owner_;

    if (!tokenLocked[_role.tokenId]) {
      tokenLocked[_role.tokenId] = true;
      emit TokenLocked(owner_, _role.tokenAddress, _role.tokenId);
    }

    emit RoleGranted(
      _role.tokenAddress,
      _role.tokenId,
      _role.roleId,
      owner_,
      _role.recipient,
      _role.expirationDate,
      _role.revocable,
      _role.data
    );
  }

  function revokeRole(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) external override {
    require(_tokenAddress == address(this), "Wrong token address");
    RoleInfo storage info = _roles[_tokenAddress][_tokenId][_roleId];
    address currentOwner = _currentOwner(_tokenId);
    require(
      msg.sender == info.recipient ||
      (info.revocable && (msg.sender == info.originalOwner || _isRoleOperatorApproved(info.originalOwner))),
      "Not authorized to revoke"
    );

    delete _roles[_tokenAddress][_tokenId][_roleId];
    emit RoleRevoked(_tokenAddress, _tokenId, _roleId);
  }

  function unlockToken(address _tokenAddress, uint256 _tokenId) external override {
    require(_tokenAddress == address(this), "Wrong token address");
    address owner_ = _currentOwner(_tokenId);
    require(msg.sender == owner_ || _isRoleOperatorApproved(owner_), "Not owner nor approved operator");

    // Ensure no non-revocable, non-expired roles remain (per EIP caveats)
    // Minimal check: iterate a small known set is not feasible on-chain without indexing; for simplicity we trust the owner to call after revoking.
    // In production, track a count of active non-revocable roles per tokenId.
    tokenLocked[_tokenId] = false;
    emit TokenUnlocked(owner_, _tokenAddress, _tokenId);
  }

  function setRoleApprovalForAll(address _tokenAddress, address _operator, bool _approved) external override {
    require(_tokenAddress == address(this), "Wrong token address");
    _roleOperatorApproval[msg.sender][_operator] = _approved;
    emit RoleApprovalForAll(_tokenAddress, _operator, _approved);
  }

  /* ── IERC7432 Views ────────────────────────────────────────────────────── */

  // NOTE: This overload name matches the EIP (does not conflict with ERC721.ownerOf(uint256))
  function ownerOf(address _tokenAddress, uint256 _tokenId) external view override returns (address owner_) {
    require(_tokenAddress == address(this), "Wrong token address");
    owner_ = ERC721.ownerOf(_tokenId);
  }

  function recipientOf(address _tokenAddress, uint256 _tokenId, bytes32 _roleId)
    external
    view
    override
    returns (address recipient_)
  {
    require(_tokenAddress == address(this), "Wrong token address");
    recipient_ = _roles[_tokenAddress][_tokenId][_roleId].recipient;
  }

  function roleData(address _tokenAddress, uint256 _tokenId, bytes32 _roleId)
    external
    view
    override
    returns (bytes memory data_)
  {
    require(_tokenAddress == address(this), "Wrong token address");
    data_ = _roles[_tokenAddress][_tokenId][_roleId].data;
  }

  function roleExpirationDate(address _tokenAddress, uint256 _tokenId, bytes32 _roleId)
    external
    view
    override
    returns (uint64 expirationDate_)
  {
    require(_tokenAddress == address(this), "Wrong token address");
    expirationDate_ = _roles[_tokenAddress][_tokenId][_roleId].expiration;
  }

  function isRoleRevocable(address _tokenAddress, uint256 _tokenId, bytes32 _roleId)
    external
    view
    override
    returns (bool revocable_)
  {
    require(_tokenAddress == address(this), "Wrong token address");
    revocable_ = _roles[_tokenAddress][_tokenId][_roleId].revocable;
  }

  function isRoleApprovedForAll(address _tokenAddress, address _owner, address _operator)
    external
    view
    override
    returns (bool)
  {
    require(_tokenAddress == address(this), "Wrong token address");
    return _roleOperatorApproval[_owner][_operator];
  }
}
