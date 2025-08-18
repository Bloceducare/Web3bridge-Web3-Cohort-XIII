// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Lottery {
    address public owner;
    address[] public players;
    mapping(address => bool) public hasEntered;
    uint256 public constant ENTRY_FEE = 0.01 ether;
    uint256 public constant MAX_PLAYERS = 10;
    
    event PlayerJoined(address indexed player, uint256 playerCount);
    event WinnerSelected(address indexed winner, uint256 prizeAmount);
    event LotteryReset();
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier lotteryNotFull() {
        require(players.length < MAX_PLAYERS, "Lottery is full");
        _;
    }
    
    modifier hasMinimumPlayers() {
        require(players.length >= MAX_PLAYERS, "Need 10 players to select winner");
        _;
    }
    
    modifier hasNotEntered() {
        require(!hasEntered[msg.sender], "Player has already entered this round");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function enterLottery() external payable lotteryNotFull hasNotEntered {
        require(msg.value == ENTRY_FEE, "Entry fee must be exactly 0.01 ETH");
        
        players.push(msg.sender);
        hasEntered[msg.sender] = true;
        
        emit PlayerJoined(msg.sender, players.length);
        
        if (players.length == MAX_PLAYERS) {
            _selectWinner();
        }
    }
    
    function _selectWinner() internal hasMinimumPlayers {
       
        uint256 randomIndex = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    players,
                    block.number
                )
            )
        ) % players.length;
        
        address winner = players[randomIndex];
        uint256 prizeAmount = address(this).balance;
        
        (bool success, ) = payable(winner).call{value: prizeAmount}("");
        require(success, "Transfer to winner failed");
        
        emit WinnerSelected(winner, prizeAmount);
        
        _resetLottery();
    }
    
    function _resetLottery() internal {
        for (uint256 i = 0; i < players.length; i++) {
            hasEntered[players[i]] = false;
        }
        delete players;
        
        emit LotteryReset();
    }
    
    function emergencyReset() external onlyOwner {
        for (uint256 i = 0; i < players.length; i++) {
            (bool success, ) = payable(players[i]).call{value: ENTRY_FEE}("");
            require(success, "Refund failed");
            hasEntered[players[i]] = false;
        }
        delete players;
        
        emit LotteryReset();
    }
    
    function getPlayers() external view returns (address[] memory) {
        return players;
    }
    
    function getPlayerCount() external view returns (uint256) {
        return players.length;
    }
    
    function getPrizePool() external view returns (uint256) {
        return address(this).balance;
    }
    
    function getEntryFee() external pure returns (uint256) {
        return ENTRY_FEE;
    }
    
    function getMaxPlayers() external pure returns (uint256) {
        return MAX_PLAYERS;
    }
    
    function hasPlayerEntered(address player) external view returns (bool) {
        return hasEntered[player];
    }
    
    function emergencyWithdraw() external onlyOwner {
        require(players.length == 0, "Cannot withdraw while lottery is active");
        
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Emergency withdrawal failed");
    }
}