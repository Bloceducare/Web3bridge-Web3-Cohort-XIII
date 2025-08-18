// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IERC7432.sol";
import "./NftCollection.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GatedDAO is Ownable {
    NftCollection public nft;
    IERC7432 public registry;

     struct Proposal {
        uint256 id;
        address proposer;
        address tokenAddress;
        uint256 tokenId;
        bytes32 roleId;
        string description;
        uint256 createdAt;
        uint256 votesFor;
        uint256 votesAgainst;
        bool executed;
    }


    // canonical role IDs (you can change names to keccak256("...()") patterns)
    bytes32 public constant ROLE_MEMBER = keccak256("MEMBER()");
    bytes32 public constant ROLE_PROPOSER = keccak256("PROPOSER()");
    bytes32 public constant ROLE_VOTER = keccak256("VOTER()");
    bytes32 public constant ROLE_RESOURCE = keccak256("RESOURCE_ACCESS()");
    bytes32 public constant ROLE_ADMIN = keccak256("ADMIN()");

    // bookkeeping: tokenId => registered flag
    mapping(uint256 => bool) public isRegistered;
    uint256 private _proposalCounter;
    mapping(uint256 => Proposal) public proposals;

    event MemberRegistered(address indexed member, uint256 indexed tokenId);
    event RoleAssigned(
        address indexed recipient,
        uint256 indexed tokenId,
        bytes32 roleId,
        uint64 expiration,
        bool revocable
    );
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        address tokenAddress,
        uint256 tokenId,
        bytes32 roleId,
        string description
    );

    constructor(address _nftAddress, address _registryAddress) Ownable(msg.sender){
        require(
            _nftAddress != address(0) && _registryAddress != address(0),
            "Bad addresses"
        );
        nft = NftCollection(_nftAddress);
        registry = IERC7432(_registryAddress);
    }

    function registerMember(
        address member,
        bytes32[] calldata roleIds,
        uint64[] calldata expirations,
        bool[] calldata revocables,
        bytes[] calldata datas
    ) external onlyOwner returns (uint256 tokenId) {
        require(member != address(0), "Bad member");
        require(
            roleIds.length == expirations.length &&
                roleIds.length == revocables.length &&
                roleIds.length == datas.length,
            "Length mismatch"
        );

        tokenId = nft.mintTo(member);

        isRegistered[tokenId] = true;
        emit MemberRegistered(member, tokenId);

        for (uint256 i = 0; i < roleIds.length; ++i) {
            IERC7432.Role memory r = IERC7432.Role({
                roleId: roleIds[i],
                tokenAddress: address(nft),
                tokenId: tokenId,
                recipient: member,
                expirationDate: expirations[i],
                revocable: revocables[i],
                data: datas[i]
            });

            registry.grantRole(r);
            emit RoleAssigned(
                member,
                tokenId,
                roleIds[i],
                expirations[i],
                revocables[i]
            );
        }
    }

    
    
    function createProposal(
        address tokenAddress,
        uint256 tokenId,
        bytes32 roleId,
        string calldata description
    ) external {
        require(
            _hasActiveRole(msg.sender, roleId, tokenAddress, tokenId),
            "Not an active role holder"
        );
         _proposalCounter++;

        // Store proposal
        proposals[_proposalCounter] = Proposal({
            id: _proposalCounter,
            proposer: msg.sender,
            tokenAddress: tokenAddress,
            tokenId: tokenId,
            roleId: roleId,
            description: description,
            createdAt: block.timestamp,
            votesFor: 0,
            votesAgainst: 0,
            executed: false
        });
    emit ProposalCreated(
            _proposalCounter,
            msg.sender,
            tokenAddress,
            tokenId,
            roleId,
            description
        );
    }

    function _hasActiveRole(
        address account,
        bytes32 roleId,
        address tokenAddress,
        uint256 tokenId
    ) internal view returns (bool) {
        address recip = registry.recipientOf(tokenAddress, tokenId, roleId);
        if (recip != account) return false;
        uint64 exp = registry.roleExpirationDate(tokenAddress, tokenId, roleId);
        return (exp == type(uint64).max) || (uint256(exp) >= block.timestamp);
    }

    function assignRoleToToken(
        uint256 tokenId,
        bytes32 roleId,
        address recipient,
        uint64 expirationDate,
        bool revocable,
        bytes calldata data
    ) external onlyOwner {
        IERC7432.Role memory r = IERC7432.Role({
            roleId: roleId,
            tokenAddress: address(nft),
            tokenId: tokenId,
            recipient: recipient,
            expirationDate: expirationDate,
            revocable: revocable,
            data: data
        });
        registry.grantRole(r);
        emit RoleAssigned(
            recipient,
            tokenId,
            roleId,
            expirationDate,
            revocable
        );
    }
}
