// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Lottery {
    uint256 public constant ENTRY_FEE = 0.01 ether;
    uint256 public constant MAX_PLAYERS = 10;
    
    address[] public players;
    mapping(address => bool) public hasEntered;
    uint256 public lotteryRound;
    uint256 public totalPrizePool;
    
    event PlayerJoined(address indexed player, uint256 round, uint256 playerCount);
    event WinnerSelected(address indexed winner, uint256 round, uint256 prizeAmount);
    event LotteryReset(uint256 newRound);
    
    constructor() {
        lotteryRound = 1;
    }
    
    function enterLottery() external payable {
        require(msg.value == ENTRY_FEE, "Must pay exactly 0.01 ETH");
        require(!hasEntered[msg.sender], "Already entered this round");
        require(players.length < MAX_PLAYERS, "Lottery is full");
        
        players.push(msg.sender);
        hasEntered[msg.sender] = true;
        totalPrizePool += msg.value;
        
        emit PlayerJoined(msg.sender, lotteryRound, players.length);
        
        if (players.length == MAX_PLAYERS) {
            selectWinner();
        }
    }
    
    function selectWinner() internal {
        require(players.length > 0, "No players in lottery");
        
        uint256 randomIndex = generateRandomNumber() % players.length;
        address winner = players[randomIndex];
        uint256 prizeAmount = totalPrizePool;
        
        emit WinnerSelected(winner, lotteryRound, prizeAmount);
        
        payable(winner).transfer(prizeAmount);
        
        resetLottery();
    }
    
    function generateRandomNumber() internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            players.length
        )));
    }
    
    function resetLottery() internal {
        for (uint256 i = 0; i < players.length; i++) {
            hasEntered[players[i]] = false;
        }
        
        delete players;
        totalPrizePool = 0;
        lotteryRound++;
        
        emit LotteryReset(lotteryRound);
    }
    
    function getPlayers() external view returns (address[] memory) {
        return players;
    }
    
    function getPlayerCount() external view returns (uint256) {
        return players.length;
    }
    
    function getPrizePool() external view returns (uint256) {
        return totalPrizePool;
    }
    
    function getCurrentRound() external view returns (uint256) {
        return lotteryRound;
    }
}
