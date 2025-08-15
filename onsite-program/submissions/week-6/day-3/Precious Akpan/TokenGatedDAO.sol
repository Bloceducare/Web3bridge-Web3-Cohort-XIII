// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract TokenGatedDAO {
    address public nftContract;
    address public rolesRegistry;
    bytes32 public constant MEMBER_ROLE = keccak256("MEMBER");

    struct Proposal {
        address creator;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        uint256 deadline;
    }

    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;

    event ProposalCreated(uint256 indexed proposalId, address creator, string description, uint256 deadline);
    event Voted(uint256 indexed proposalId, address voter, bool support);

    constructor(address _nftContract, address _rolesRegistry) {
        nftContract = _nftContract;
        rolesRegistry = _rolesRegistry;
    }

    function propose(string memory description) external returns (uint256) {
        require(hasMemberRole(msg.sender), "Must have MEMBER role");
        proposalCount++;
        proposals[proposalCount] = Proposal({
            creator: msg.sender,
            description: description,
            forVotes: 0,
            againstVotes: 0,
            executed: false,
            deadline: block.timestamp + 1 days
        });
        emit ProposalCreated(proposalCount, msg.sender, description, block.timestamp + 1 days);
        return proposalCount;
    }

    function vote(uint256 proposalId, bool support) external {
        require(hasMemberRole(msg.sender), "Must have MEMBER role");
        Proposal storage proposal = proposals[proposalId];
        require(proposal.creator != address(0), "Proposal does not exist");
        require(block.timestamp <= proposal.deadline, "Voting period ended");
        require(!proposal.executed, "Proposal already executed");

        if (support) {
            proposal.forVotes += 1;
        } else {
            proposal.againstVotes += 1;
        }
        emit Voted(proposalId, msg.sender, support);
    }

    function hasMemberRole(address account) public view returns (bool) {
        for (uint256 tokenId = 1; tokenId <= 100; tokenId++) {
            try IERC721(nftContract).ownerOf(tokenId) returns (address owner) {
                if (owner == account) {
                    address recipient = IERC7432(rolesRegistry).recipientOf(nftContract, tokenId, MEMBER_ROLE);
                    if (recipient == account && block.timestamp < IERC7432(rolesRegistry).roleExpirationDate(nftContract, tokenId, MEMBER_ROLE)) {
                        return true;
                    }
                }
            } catch {
                continue;
            }
        }
        return false;
    }
}

interface IERC721 {
    function ownerOf(uint256 tokenId) external view returns (address);
}

interface IERC7432 {
    function recipientOf(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (address);
    function roleExpirationDate(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (uint64);
}