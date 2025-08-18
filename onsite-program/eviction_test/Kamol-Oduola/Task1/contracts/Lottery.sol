// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Lottery {
    // State variables
    uint256 public constant PARTICIPATION_COST = 0.01 ether;
    uint256 public constant MAXIMUM_PARTICIPANTS = 10;
    
    address[] public participants;
    address public champion;
    uint256 public rewardPool;
    uint256 public roundNumber;
    
    // Mapping to track if a participant has already entered the current round
    mapping(address => bool) public hasEntered;
    
    // Events
    event ParticipantEntered(address indexed participant, uint256 roundNumber, uint256 currentParticipantCount);
    event ChampionSelected(address indexed champion, uint256 reward, uint256 roundNumber);
    event RoundReset(uint256 newRoundNumber);
    
    // Custom errors for gas optimization
    error IncorrectParticipationCost();
    error AlreadyEntered();
    error RoundFull();
    error NoParticipantsInRound();
    error UnauthorizedChampionSelection();
    
  
    constructor() {
        roundNumber = 1;
    }
    
   
    function enterLottery() external payable {
        // Check if the correct participation cost is paid
        if (msg.value != PARTICIPATION_COST) {
            revert IncorrectParticipationCost();
        }
        
        // Check if participant has already entered this round
        if (hasEntered[msg.sender]) {
            revert AlreadyEntered();
        }
        
        // Check if lottery round is already full
        if (participants.length >= MAXIMUM_PARTICIPANTS) {
            revert RoundFull();
        }
        
        // Add participant to the lottery
        participants.push(msg.sender);
        hasEntered[msg.sender] = true;
        rewardPool += msg.value;
        
        emit ParticipantEntered(msg.sender, roundNumber, participants.length);
        
        // Automatically select champion if we have 10 participants
        if (participants.length == MAXIMUM_PARTICIPANTS) {
            _selectChampion();
        }
    }
    
 
    function _selectChampion() internal {
        if (participants.length == 0) {
            revert NoParticipantsInRound();
        }
        
        
        uint256 randomPosition = _generateRandomNumber() % participants.length;
        champion = participants[randomPosition];
        
        // Transfer reward to champion
        uint256 reward = rewardPool;
        rewardPool = 0;
        
        emit ChampionSelected(champion, reward, roundNumber);
        
        // Transfer the reward to the champion
        (bool success, ) = payable(champion).call{value: reward}("");
        require(success, "Reward transfer failed");
        
        // Reset lottery for next round
        _resetRound();
    }
    
    function _generateRandomNumber() internal view returns (uint256) {
        return uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao, // More secure than block.difficulty in post-merge Ethereum
                    participants.length,
                    msg.sender
                )
            )
        );
    }
    
   
    function _resetRound() internal {
        // Clear participants array
        for (uint256 i = 0; i < participants.length; i++) {
            hasEntered[participants[i]] = false;
        }
        delete participants;
        
        // Increment round number
        roundNumber++;
        
        emit RoundReset(roundNumber);
    }
    
   
    
   
    function getParticipants() external view returns (address[] memory) {
        return participants;
    }
    
 
    function getParticipantCount() external view returns (uint256) {
        return participants.length;
    }
    
   
    function getRewardPool() external view returns (uint256) {
        return rewardPool;
    }
    
   
    function getRoundNumber() external view returns (uint256) {
        return roundNumber;
    }
    
 
    function getLastChampion() external view returns (address) {
        return champion;
    }
    
 
    function hasParticipantEntered(address participant) external view returns (bool) {
        return hasEntered[participant];
    }
    
   
    function getSpotsRemaining() external view returns (uint256) {
        return MAXIMUM_PARTICIPANTS - participants.length;
    }
    
   
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}