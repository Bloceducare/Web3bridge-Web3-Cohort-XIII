// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Lottery {
    uint256 public constant ENTRY_FEE = 0.01 ether;
    uint256 public constant MAX_PLAYERS = 10;
    
    address payable[] public players;
    address public owner;
    uint256 public lotteryId;
    mapping(address => bool) public hasEntered;
    
    event PlayerEntered(address indexed player, uint256 lotteryId);
    event WinnerPicked(address indexed winner, uint256 amount, uint256 lotteryId);
    event LotteryReset(uint256 newLotteryId);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    
    modifier correctFee() {
        require(msg.value == ENTRY_FEE, "Incorrect entry fee");
        _;
    }
    
    modifier notAlreadyEntered() {
        require(!hasEntered[msg.sender], "Already entered this round");
        _;
    }
    
    modifier lotteryNotFull() {
        require(players.length < MAX_PLAYERS, "Lottery is full");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        lotteryId = 1;
    }
    
    function enter() external payable correctFee notAlreadyEntered lotteryNotFull {
        players.push(payable(msg.sender));
        hasEntered[msg.sender] = true;
        
        emit PlayerEntered(msg.sender, lotteryId);
        
        // Automatically pick winner when we reach MAX_PLAYERS
        if (players.length == MAX_PLAYERS) {
            _pickWinner();
        }
    }
    
    function _pickWinner() private {
        require(players.length == MAX_PLAYERS, "Not enough players");
        
        // Generate pseudo-random number (NOTE: This is not truly random and not suitable for production)
        // For production, use Chainlink VRF or similar oracle service
        uint256 winnerIndex = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.difficulty,
                    players
                )
            )
        ) % players.length;
        
        address payable winner = players[winnerIndex];
        uint256 prizePool = address(this).balance;
        
        // Transfer the prize to winner
        winner.transfer(prizePool);
        
        emit WinnerPicked(winner, prizePool, lotteryId);
        
        // Reset lottery
        _resetLottery();
    }
    
    function _resetLottery() private {
        // Clear players array
        for (uint256 i = 0; i < players.length; i++) {
            hasEntered[players[i]] = false;
        }
        
        delete players;
        lotteryId++;
        
        emit LotteryReset(lotteryId);
    }
    
    // Emergency function to pick winner manually (only owner)
    function emergencyPickWinner() external onlyOwner {
        require(players.length > 0, "No players in lottery");
        _pickWinner();
    }
    
    // View functions
    function getPlayers() external view returns (address payable[] memory) {
        return players;
    }
    
    function getPlayersCount() external view returns (uint256) {
        return players.length;
    }
    
    function getPrizePool() external view returns (uint256) {
        return address(this).balance;
    }
    
    function getCurrentLotteryId() external view returns (uint256) {
        return lotteryId;
    }
    
    function hasPlayerEntered(address player) external view returns (bool) {
        return hasEntered[player];
    }
}