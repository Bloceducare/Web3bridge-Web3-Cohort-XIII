// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Lottery Smart Contract
 * @dev A decentralized lottery system where players can join by paying 0.01 ETH
 * @notice This contract automatically selects a winner after 10 players join
 */
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
    
    /**
     * @dev Constructor initializes the first lottery
     */
    constructor() {
        lotteryId = 1;
    }
    
    /**
     * @dev Allows a player to join the lottery by paying the exact entry fee
     * @notice Players can only join once per lottery round
     */
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
    
    /**
     * @dev Internal function to select a random winner
     * @notice Uses block properties for randomness (not cryptographically secure)
     */
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
    
    /**
     * @dev Generates a pseudo-random number using block properties
     * @return A pseudo-random uint256 number
     * @notice This is not cryptographically secure and should not be used in production
     */
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
    
    /**
     * @dev Resets the lottery for the next round
     */
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
    
    /**
     * @dev Returns all current players in the lottery
     * @return Array of player addresses
     */
    function getPlayers() external view returns (address[] memory) {
        return players;
    }
    
    /**
     * @dev Returns the number of current players
     * @return Number of players currently in the lottery
     */
    function getPlayerCount() external view returns (uint256) {
        return players.length;
    }
    
    /**
     * @dev Returns the current prize pool
     * @return Current prize pool in wei
     */
    function getPrizePool() external view returns (uint256) {
        return prizePool;
    }
    
    /**
     * @dev Returns the current lottery ID
     * @return Current lottery round ID
     */
    function getLotteryId() external view returns (uint256) {
        return lotteryId;
    }
    
    /**
     * @dev Returns the last winner (from previous round)
     * @return Address of the last winner
     */
    function getLastWinner() external view returns (address) {
        return winner;
    }
    
    /**
     * @dev Checks if a specific address has joined the current lottery
     * @param player Address to check
     * @return True if the player has joined, false otherwise
     */
    function hasPlayerJoined(address player) external view returns (bool) {
        return hasJoined[player];
    }
    
    /**
     * @dev Returns the number of spots remaining in the current lottery
     * @return Number of spots remaining (0-10)
     */
    function getSpotsRemaining() external view returns (uint256) {
        return MAX_PLAYERS - players.length;
    }
    
    /**
     * @dev Emergency function to get contract balance (should normally be 0 after each round)
     * @return Contract balance in wei
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}