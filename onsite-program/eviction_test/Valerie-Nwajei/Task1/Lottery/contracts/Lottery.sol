// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ILottery.sol";

contract Lottery is ILottery {
    uint256 public constant MAX_PLAYERS = 10;
    uint256 public constant ENTRY_FEE = 0.01 ether;
    
    uint256 private currentRound;
    address[] private players;
    address private lastWinner;
    uint256 private lastPrize;
    
    mapping(uint256 => mapping(address => bool)) private roundPlayers;
    
    modifier validEntry() {
        require(msg.value == ENTRY_FEE, "Incorrect ETH amount");
        require(!roundPlayers[currentRound][msg.sender], "Already entered this round");
        _;
    }
    
    constructor() {
        currentRound = 1;
        emit RoundStarted(currentRound);
    }
    
    function enter() external payable validEntry {
        players.push(msg.sender);
        roundPlayers[currentRound][msg.sender] = true;
        
        emit PlayerEntered(msg.sender, currentRound);
        
        if (players.length == MAX_PLAYERS) {
            _selectWinner();
        }
    }
    
    function getCurrentRound() external view returns (uint256) {
        return currentRound;
    }
    
    function getPlayers() external view returns (address[] memory) {
        return players;
    }
    
    function getEntryFee() external pure returns (uint256) {
        return ENTRY_FEE;
    }
    
    function getPrizePool() external view returns (uint256) {
        return address(this).balance;
    }
    
    function getLastWinner() external view returns (address) {
        return lastWinner;
    }
    
    function _selectWinner() private {
        require(players.length == MAX_PLAYERS, "Not enough players");
        
        uint256 prizePool = address(this).balance;
        uint256 winnerIndex = _random() % MAX_PLAYERS;
        address winner = players[winnerIndex];
        
        (bool success, ) = winner.call{value: prizePool}("");
        require(success, "Transfer failed");
        
        lastWinner = winner;
        lastPrize = prizePool;
        
        emit WinnerSelected(winner, prizePool, currentRound);
        
        _resetLottery();
    }
    
    function _resetLottery() private {
        delete players;
        currentRound++;
        emit RoundStarted(currentRound);
    }
    
    function _random() private view returns (uint256) {
        // Note: This is not truly random - for production use Chainlink VRF
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            players
        )));
    }
}