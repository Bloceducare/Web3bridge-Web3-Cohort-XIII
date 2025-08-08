// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Multisig {
   address public immutable owner;
   uint256 public requiredSignatureCount = 3;

   mapping(address => bool) isSigner;
   mapping(uint256 => Proposal) idToProposal;

   enum Status{ PENDING, APPROVED}
   
   uint256 proposalId;
   
   struct Proposal{
    address recipient;
    uint256 amount;
    address proposer;
    uint256 signatureCount;
    address[] signers;
    Status status;
   }   

    constructor() payable {
      owner=msg.sender;
      isSigner[msg.sender] = true;
    }

    receive() external payable{}

    function setSigner(address _signer, bool _isSigner) external onlyOwner() {
        isSigner[_signer] = _isSigner;
    }

    function getSignerStatus(address _signer) external view returns(bool) {
        return isSigner[_signer];
    }

    function makeTransfer(address _recipient, uint256 _amount) internal {
        payable(_recipient).transfer(_amount);
    }

    function makeProposal(address _recipient, uint256 _amount) external onlySigner returns(uint256){
        address[] memory signers = new address[](1);
        signers[0] = msg.sender;
        idToProposal[proposalId] = Proposal(_recipient, _amount, msg.sender, 1, signers, Status.PENDING);
        proposalId = proposalId + 1;
        return proposalId - 1;
    } 

    function getProposal(uint256 _proposalId) external view returns(Proposal memory){
        return idToProposal[_proposalId];
    }

    function signProposal(uint256 _proposalId) external onlySigner{
        if (idToProposal[_proposalId].status== Status.APPROVED){
            revert("Proposal has been approved");
        }

        for (uint i; i < idToProposal[_proposalId].signers.length; i++){
            if (idToProposal[_proposalId].signers[i] == msg.sender){
                revert("You've signed this proposal");
            }
        }
        idToProposal[_proposalId].signatureCount = idToProposal[_proposalId].signatureCount + 1;
        idToProposal[_proposalId].signers.push(msg.sender);
        if (idToProposal[_proposalId].signatureCount >= requiredSignatureCount){
            makeTransfer(idToProposal[_proposalId].recipient, idToProposal[_proposalId].amount);
            idToProposal[_proposalId].status = Status.APPROVED;
        }

    }


    modifier onlyOwner{
        if (msg.sender != owner){
            revert("only owner can make this transaction");
        }
        _;
    }

    modifier onlySigner{
        if (!isSigner[msg.sender]){
            revert("only a signer can make this transaction");
        }
        _;
    }

   
}
