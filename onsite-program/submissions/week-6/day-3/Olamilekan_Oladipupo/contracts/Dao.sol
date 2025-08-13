// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "../contracts/NftRoles.sol";
import "../contracts/interfaces/IDao.sol";
import "../contracts/Nft.sol";


error PROPOSAL_DOES_NOT_EXIST();
error PROPOSAL_EXECUTED();
error NOT_ENOUGH_VOTE();
error NOT_ADMIN();
error NOT_OWNER();

contract Dao is IDao {
    NftRoles nftRoles;
    Nft nft;

    mapping( uint256 => Proposal) proposals;
    uint256 id;
    Proposal[] allProposal;
    mapping(address => bool) members;
    address admin;
    string  tokenUri;

    bytes32 public constant VOTER_ROLE     = keccak256("VOTER_ROLE");
    bytes32 public constant PROPOSER_ROLE  = keccak256("PROPOSER_ROLE");
    bytes32 public constant RESOURCE_ROLE  = keccak256("RESOURCE_ROLE");






    constructor(address _nftRoles, address _admin, address _nftAddress){
        nftRoles = NftRoles(_nftRoles);
        nft = Nft(_nftAddress);
        admin = _admin;
    }



    function createProposal(string memory _description) owners(msg.sender) external returns(Proposal memory){
        uint256 proposalId = id++;
        Proposal memory newProposal;
        newProposal.id = proposalId;
        newProposal.createdBy = msg.sender;
        newProposal.description = _description;
        proposals[proposalId] = newProposal;

        allProposal.push(newProposal);

    return newProposal;
    }

    function vote(uint256 _proposalId) owners(msg.sender) external{
        require(proposals[_proposalId].createdBy != address(0), PROPOSAL_DOES_NOT_EXIST());
        proposals[_proposalId].votesFor++;
    }

    function executeProposal(uint256 _proposalId) external{
        require(proposals[_proposalId].createdBy != address(0), PROPOSAL_DOES_NOT_EXIST());
        require(proposals[_proposalId].executed == false, PROPOSAL_EXECUTED());
        require(proposals[_proposalId].votesFor > 0,NOT_ENOUGH_VOTE());


        proposals[_proposalId].executed = true;

    }
    function getProposals() view external returns(Proposal [] memory){
        return allProposal;
    }

    function getProposal(uint256 _proposalId) view external returns(Proposal memory){
        require(proposals[_proposalId].createdBy != address(0), PROPOSAL_DOES_NOT_EXIST());
        return proposals[_proposalId];
    }

    function grantRole(string memory role, uint64 _deadline, address _toGrantRole, bool _revocable) onlyAdmin() external  {
        require(_deadline > block.timestamp, "dead line cann br in the past");
        if (keccak256(bytes(role)) == keccak256(bytes("Voting right"))) {
            uint256 tokenId = mintNft(_toGrantRole);
            nftRoles.grantRoleDao(VOTER_ROLE, address(nft), tokenId, _toGrantRole,_deadline, _revocable,bytes (""));
        }

        if (keccak256(bytes(role)) == keccak256(bytes("Proposer right"))) {
            uint256 tokenId = mintNft(_toGrantRole);
            nftRoles.grantRoleDao(VOTER_ROLE, address(nft), tokenId, _toGrantRole,_deadline, _revocable, bytes (""));
        }

        if (keccak256(bytes(role)) == keccak256(bytes("Resource right"))) {
            uint256 tokenId = mintNft(_toGrantRole);
            nftRoles.grantRoleDao(VOTER_ROLE, address(nft), tokenId, _toGrantRole,_deadline, _revocable, bytes (""));
        }

        revert("Invalid role");



    }


    function setTokenUri (string memory _tokenUri)  external {
        tokenUri = _tokenUri;
    }

    function mintNft (address to) private returns(uint256) {
        return nft.mintRole(to, tokenUri);
    }


    function addMember(address _member) external onlyAdmin() {
        members[_member] =  true;
    }

    modifier onlyAdmin() {
        require(msg.sender ==  admin, NOT_ADMIN());
        _;
    }

    modifier owners(address senderAddress) {
        require(members[senderAddress], NOT_OWNER());
        _;
    }



}
