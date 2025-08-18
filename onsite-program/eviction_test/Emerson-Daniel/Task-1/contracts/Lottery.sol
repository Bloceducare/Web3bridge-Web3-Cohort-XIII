// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Lottery {
    uint256 public constant ENTRY_FEE = 0.02 ether;
    uint256 public constant MAX_PLAYERS = 10;
    
    address[] public players;
    mapping(address => bool) public hasEntered;
    uint256 public currentRound;
    
    event PlayerJoined(address indexed player, uint256 round);
    event WinnerSelected(address indexed winner, uint256 amount, uint256 round);
    event LotteryReset(uint256 newRound);
    
    modifier onlyValidEntry() {
        require(msg.value == ENTRY_FEE, "Must send exactly 0.02 ETH");
        require(!hasEntered[msg.sender], "Already entered this round");
        require(players.length < MAX_PLAYERS, "Lottery is full");
        _;
    }
    
    modifier onlyWhenFull() {
        require(players.length == MAX_PLAYERS, "Need exactly 10 players");
        _;
    }
    
    function enterLottery() external payable onlyValidEntry {
        players.push(msg.sender);
        hasEntered[msg.sender] = true;
        
        emit PlayerJoined(msg.sender, currentRound);
        
        if (players.length == MAX_PLAYERS) {
            _selectWinner();
        }
    }
    
    function _selectWinner() private onlyWhenFull {
        uint256 randomIndex = _generateRandomNumber() % MAX_PLAYERS;
        address winner = players[randomIndex];
        uint256 prizeAmount = address(this).balance;
        
        emit WinnerSelected(winner, prizeAmount, currentRound);
        
        (bool success, ) = winner.call{value: prizeAmount}("");
        require(success, "Transfer failed");
        
        _resetLottery();
    }
    
    function _generateRandomNumber() private view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            players.length,
            msg.sender
        )));
    }
    
    function _resetLottery() private {
        for (uint256 i = 0; i < players.length; i++) {
            hasEntered[players[i]] = false;
        }
        
        delete players;
        currentRound++;
        
        emit LotteryReset(currentRound);
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
    
    function getCurrentRound() external view returns (uint256) {
        return currentRound;
    }
}
