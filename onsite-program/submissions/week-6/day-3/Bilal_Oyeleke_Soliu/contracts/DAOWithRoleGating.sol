// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { RegisterNFT } from "./NFT.sol";
import { IERC7432 } from "./interfaces/EIP-7432.sol";
import "./interfaces/daoInterface.sol";

contract ManageDAO is daoInterface {

    error CAN_NOT_BE_EMPTY();
    error NOT_A_MEMBER();
    error MEMBER_ALREADY_EXISTS();
    error ROLE_EXPIRED();
    error PERMISSION_DENIED();

    address admin;
    mapping(address => Member) public members;
    mapping(RoleType => mapping(string => bool)) public permissions;

    bytes32 public constant worker = keccak256("WORKER");
    bytes32 public constant contributor = keccak256("CONTRIBUTOR");
    mapping(uint256 => mapping(bytes32 => RoleData)) private _roles;
    mapping(uint256 => Proposal) public proposals;

    event ProposalCreated(uint256 indexed proposalId, string name, address indexed creator);

    IERC7432 private eip7432Contract;

    constructor(address _eip7432address) {
        admin = msg.sender;
        eip7432Contract = IERC7432(_eip7432address);

        permissions[RoleType.protocolWorker]["vote"] = true;
        permissions[RoleType.protocolWorker]["createProposal"] = true;
        permissions[RoleType.protocolWorker]["accessResources"] = true;

        permissions[RoleType.protocolContributor]["vote"] = true;
        permissions[RoleType.protocolContributor]["createProposal"] = false;
        permissions[RoleType.protocolContributor]["accessResources"] = false;
    }

    modifier onlyOwner() {
        require(admin == msg.sender, "Only Admin can call this function");
        _;
    }

    function createMember(string memory _name, uint _age, address _user, uint _expirationDate, string memory _data, RoleType _role) public onlyOwner returns (Member memory) {
        uint256 tokenId;
        address nftAddress;
        bytes32 newData = keccak256(bytes(_data));

        if (members[_user].user != address(0)) {
            revert MEMBER_ALREADY_EXISTS();
        }

        if (_role == RoleType.protocolWorker) {
            RegisterNFT nft = new RegisterNFT("Protocol Worker NFT", "PWNFT", address(this));
            tokenId = nft.mintWorkerNFT(_user, "https://example.com/worker-nft");
            nftAddress = address(nft);
            IERC7432.Role memory newRole = IERC7432.Role(worker, nftAddress, tokenId, _user, uint64(_expirationDate), true, abi.encode(newData));
            eip7432Contract.grantRole(newRole);
            _roles[tokenId][worker] = RoleData(_expirationDate, abi.encode(newData));

        } else if (_role == RoleType.protocolContributor) {
            RegisterNFT nft = new RegisterNFT("Protocol Contributor NFT", "PCNFT", address(this));
            tokenId = nft.mintContributorNFT(_user, "https://example.com/contributor-nft");
            nftAddress = address(nft);
            IERC7432.Role memory newRole = IERC7432.Role(contributor, nftAddress, tokenId, _user, uint64(_expirationDate), true, abi.encode(newData));
            eip7432Contract.grantRole(newRole);
            _roles[tokenId][contributor] = RoleData(_expirationDate, abi.encode(newData));
        }

        members[_user] = Member({
            name: _name,
            age: _age,
            user: _user,
            expirationDate: _expirationDate,
            data: _data,
            role: _role,
            nftAddress: nftAddress,
            tokenId: tokenId
        });

        return members[_user];
    }

    function getRoleExpiryDate(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) public view returns (uint64) {
        return eip7432Contract.roleExpirationDate(_tokenAddress, _tokenId, _roleId);
    }

    function createProposal(string memory _proposalName, string memory _proposalDescription) public {
        if (bytes(_proposalName).length == 0 || bytes(_proposalDescription).length == 0) {
            revert CAN_NOT_BE_EMPTY();
        }

        if (members[msg.sender].user == address(0)) {
            revert NOT_A_MEMBER();
        }

        bytes32 roleId;
        if (members[msg.sender].role == RoleType.protocolWorker) {
            roleId = worker;
        } else if (members[msg.sender].role == RoleType.protocolContributor) {
            roleId = contributor;
        }
        uint64 expiryDate = getRoleExpiryDate(members[msg.sender].nftAddress, members[msg.sender].tokenId, roleId);

        if (expiryDate < block.timestamp) {
            revert ROLE_EXPIRED();
        }

        if (!permissions[members[msg.sender].role]["createProposal"]) {
            revert PERMISSION_DENIED();
        }

        uint256 proposalId = uint256(keccak256(abi.encodePacked(_proposalName, block.timestamp)));

        proposals[proposalId] = Proposal({
            name: _proposalName,
            description: _proposalDescription,
            creator: msg.sender,
            createdAt: block.timestamp,
            votesTrue: 0,
            votesFalse: 0,
            isActive: true
        });

        emit ProposalCreated(proposalId, _proposalName, msg.sender);
    }

    function castVote(uint256 _proposalId, bool _vote) public {
        if (members[msg.sender].user == address(0)) {
            revert NOT_A_MEMBER();
        }
        if (!permissions[members[msg.sender].role]["vote"]) {
            revert PERMISSION_DENIED();
        }
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.isActive, "Proposal is not active");

        if (_vote) {
            proposal.votesTrue++;
        } else {
            proposal.votesFalse++;
        }
    }

    function viewVotes(uint256 _proposalId) public view returns (uint256, uint256) {
        if (!permissions[members[msg.sender].role]["accessResources"]) {
            revert PERMISSION_DENIED();
        }
        Proposal storage proposal = proposals[_proposalId];
        return (proposal.votesTrue, proposal.votesFalse);
    }

    function revokeRole(address _tokenAddress, uint256 _tokenId, bytes32 _roleId) public onlyOwner {
        eip7432Contract.revokeRole(_tokenAddress, _tokenId, _roleId);
    }

    function getMember(address _user) public view returns (Member memory) {
        return members[_user];
    }
}
