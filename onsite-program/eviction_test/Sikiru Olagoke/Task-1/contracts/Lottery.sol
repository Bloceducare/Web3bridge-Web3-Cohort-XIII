// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Lottery {
    // State variables
    uint256 public constant ENTRY_FEE = 0.01 ether;
    uint256 public constant MAX_PLAYERS = 10;
    
    address[] public players;
    address public winner;
    uint256 public prizePool;
    uint256 public lotteryId;
    
    // Mapping to track if a player has already joined the current round
    mapping(address => bool) public hasJoined;
    
    // Events
    event PlayerJoined(address indexed player, uint256 lotteryId, uint256 currentPlayerCount);
    event WinnerSelected(address indexed winner, uint256 prize, uint256 lotteryId);
    event LotteryReset(uint256 newLotteryId);
    
    // Custom errors for gas optimization
    error IncorrectEntryFee();
    error AlreadyJoined();
    error LotteryFull();
    error NoPlayersInLottery();
    error UnauthorizedWinnerSelection();
    
    constructor() {
        lotteryId = 1;
    }
    
 
    function joinLottery() external payable {
        // Check if the correct entry fee is paid
        if (msg.value != ENTRY_FEE) {
            revert IncorrectEntryFee();
        }
        
        // Check if player has already joined this round
        if (hasJoined[msg.sender]) {
            revert AlreadyJoined();
        }
        
        // Check if lottery is already full
        if (players.length >= MAX_PLAYERS) {
            revert LotteryFull();
        }
        
        // Add player to the lottery
        players.push(msg.sender);
        hasJoined[msg.sender] = true;
        prizePool += msg.value;
        
        emit PlayerJoined(msg.sender, lotteryId, players.length);
        
        // Automatically select winner if we have 10 players
        if (players.length == MAX_PLAYERS) {
            _selectWinner();
        }
    }
    
    function _selectWinner() internal {
        if (players.length == 0) {
            revert NoPlayersInLottery();
        }
        
        // Generate pseudo-random number
        uint256 randomIndex = _generateRandomNumber() % players.length;
        winner = players[randomIndex];
        
        // Transfer prize to winner
        uint256 prize = prizePool;
        prizePool = 0;
        
        emit WinnerSelected(winner, prize, lotteryId);
        
        // Transfer the prize to the winner
        (bool success, ) = payable(winner).call{value: prize}("");
        require(success, "Prize transfer failed");
        
        // Reset lottery for next round
        _resetLottery();
    }
    
    function _generateRandomNumber() internal view returns (uint256) {
        return uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao, // More secure than block.difficulty in post-merge Ethereum
                    players.length,
                    msg.sender
                )
            )
        );
    }
    
    function _resetLottery() internal {
        // Clear players array
        for (uint256 i = 0; i < players.length; i++) {
            hasJoined[players[i]] = false;
        }
        delete players;
        
        // Increment lottery ID
        lotteryId++;
        
        emit LotteryReset(lotteryId);
    }
    
    // View functions
    
    function getPlayers() external view returns (address[] memory) {
        return players;
    }
    
    function getPlayerCount() external view returns (uint256) {
        return players.length;
    }
    
    function getPrizePool() external view returns (uint256) {
        return prizePool;
    }
    
    function getLotteryId() external view returns (uint256) {
        return lotteryId;
    }
    
    function getLastWinner() external view returns (address) {
        return winner;
    }
    
    function hasPlayerJoined(address player) external view returns (bool) {
        return hasJoined[player];
    }
    
    function getSpotsRemaining() external view returns (uint256) {
        return MAX_PLAYERS - players.length;
    }
    
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
