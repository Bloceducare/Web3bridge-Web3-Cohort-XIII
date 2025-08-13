// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

interface IERC7432 {
    struct Role {
        bytes32 roleId;
        address tokenAddress;
        uint256 tokenId;
        address recipient;
        uint64 expirationDate;
        bool revocable;
        bytes data;
    }

    function grantRole(Role calldata _role) external;

    function revokeRole(
        address _tokenAddress,
        uint256 _tokenId,
        bytes32 _roleId
    ) external;

    function recipientOf(
        address _tokenAddress,
        uint256 _tokenId,
        bytes32 _roleId
    ) external view returns (address recipient_);

    function roleData(
        address _tokenAddress,
        uint256 _tokenId,
        bytes32 _roleId
    ) external view returns (bytes memory data_);

    function roleExpirationDate(
        address _tokenAddress,
        uint256 _tokenId,
        bytes32 _roleId
    ) external view returns (uint64 expirationDate_);
}

contract ValDAO {
    struct Proposal {
        string description;
        uint256 deadline;
        uint256 yesVotes;
        uint256 noVotes;
        bool executed;
        address proposer;
    }

    address public owner;
    uint256 public totalProposals;
    uint256 public constant VOTING_PERIOD = 7 days;
    IERC7432 public rolesRegistry;
    address public nftContract;

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => mapping(uint256 => bool)))
        public hasVoted; // proposalId => voter => tokenId => voted

    bytes32 public constant VOTER_ROLE = keccak256("VOTER");
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR");

    constructor(address _rolesRegistry, address _nftContract) {
        owner = msg.sender;
        rolesRegistry = IERC7432(_rolesRegistry);
        nftContract = _nftContract;
    }

    function createProposal(
        string calldata description,
        uint256 tokenId
    ) external {
        // Check if caller has PROPOSER_ROLE for the NFT
        require(
            rolesRegistry.recipientOf(nftContract, tokenId, PROPOSER_ROLE) ==
                msg.sender &&
                rolesRegistry.roleExpirationDate(
                    nftContract,
                    tokenId,
                    PROPOSER_ROLE
                ) >
                block.timestamp,
            "No valid proposer role"
        );

        proposals[totalProposals] = Proposal({
            description: description,
            deadline: block.timestamp + VOTING_PERIOD,
            yesVotes: 0,
            noVotes: 0,
            executed: false,
            proposer: msg.sender
        });
        totalProposals++;
    }

    function vote(
        uint256 proposalId,
        uint256[] calldata tokenIds,
        bool support
    ) external {
        Proposal storage proposal = proposals[proposalId];

        require(block.timestamp < proposal.deadline, "Voting has ended");
        require(!proposal.executed, "Proposal already executed");

        uint256 totalVotingPower = 0;

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];

            // Check if voter has VOTER_ROLE for this NFT
            require(
                rolesRegistry.recipientOf(nftContract, tokenId, VOTER_ROLE) ==
                    msg.sender &&
                    rolesRegistry.roleExpirationDate(
                        nftContract,
                        tokenId,
                        VOTER_ROLE
                    ) >
                    block.timestamp,
                "No valid voting role for this NFT"
            );

            require(
                !hasVoted[proposalId][msg.sender][tokenId],
                "Already voted with this token"
            );
            hasVoted[proposalId][msg.sender][tokenId] = true;

            // Get voting power from role data (default to 1 if no data)
            bytes memory roleData = rolesRegistry.roleData(
                nftContract,
                tokenId,
                VOTER_ROLE
            );
            uint256 votingPower = 1;
            if (roleData.length > 0) {
                votingPower = abi.decode(roleData, (uint256));
            }

            totalVotingPower += votingPower;
        }

        require(totalVotingPower > 0, "No voting power");

        if (support) {
            proposal.yesVotes += totalVotingPower;
        } else {
            proposal.noVotes += totalVotingPower;
        }
    }

    function executeProposal(uint256 proposalId, uint256 tokenId) external {
        Proposal storage proposal = proposals[proposalId];

        require(block.timestamp >= proposal.deadline, "Voting still active");
        require(!proposal.executed, "Proposal already executed");
        require(proposal.yesVotes > proposal.noVotes, "Proposal did not pass");

        // Check if caller has EXECUTOR_ROLE
        require(
            rolesRegistry.recipientOf(nftContract, tokenId, EXECUTOR_ROLE) ==
                msg.sender &&
                rolesRegistry.roleExpirationDate(
                    nftContract,
                    tokenId,
                    EXECUTOR_ROLE
                ) >
                block.timestamp,
            "No valid executor role"
        );

        proposal.executed = true;
        payable(proposal.proposer).transfer(0.001 ether);
    }

    // Helper function to grant voting roles (only owner for simplicity)
    function grantVotingRole(
        uint256 tokenId,
        address recipient,
        uint256 votingPower
    ) external {
        require(msg.sender == owner, "Only owner can grant roles");

        IERC7432.Role memory role = IERC7432.Role({
            roleId: VOTER_ROLE,
            tokenAddress: nftContract,
            tokenId: tokenId,
            recipient: recipient,
            expirationDate: type(uint64).max, // Never expires
            revocable: true,
            data: abi.encode(votingPower)
        });

        rolesRegistry.grantRole(role);
    }

    // Allow contract to receive ETH
    receive() external payable {}
}
