// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Lottery {
    address[] public participants;
    uint256 public constant ENTRY_FEE = 0.01 ether;
    address public winner;
    address public owner;
    address public contractAddress;

    event PlayerJoined(address player);
    event WinnerChosen(address winner, uint256 prize);

    constructor() {
        owner = msg.sender;
        contractAddress = address(this);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyContract() {
        require(msg.sender == contractAddress, "Only contract can call this function");
        _;
    }

    function join() external payable {
        require(msg.value == ENTRY_FEE, "Entry fee is 0.01 ETH");
        require(participants.length < 10, "Max 10 players reached");
        require(!hasJoined(msg.sender), "Cannot join twice in the same round");
        participants.push(msg.sender);
        emit PlayerJoined(msg.sender);
    }

    function selectWinner() public onlyContract {
        require(participants.length == 10, "Exactly 10 players required");
        
        uint256 random = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            blockhash(block.number - 1),
            msg.sender,
            participants
        )));
        
        uint256 index = random % 10;
        
        address winnerAddress = participants[index];
        uint256 prizeAmount = 0.1 ether; 
        
        delete participants;
        
        payable(winnerAddress).transfer(prizeAmount);
        
        winner = winnerAddress;
        
        emit WinnerChosen(winner, prizeAmount);
    }

    function hasJoined(address _player) public view returns (bool) {
        for (uint i = 0; i < participants.length; i++) {
            if (participants[i] == _player) {
                return true;
            }
        }
        return false;
    }
    
    function getParticipantCount() public view returns (uint256) {
        return participants.length;
    }

    function reset() public onlyOwner {
        delete participants;
        winner = address(0);
    }

    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
        reset();
    }

    receive() external payable {}
}