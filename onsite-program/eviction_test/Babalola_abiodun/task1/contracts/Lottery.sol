// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


contract Lottery {
    uint256 public constant Base_fee = 0.01 ether;
    uint256 public constant MAX = 10;
    
    address[] public players;
    address public winner;
    uint256 public prizePool;
    uint256 public lotteryId;
    
    mapping(address => bool) public isPlayingCurrently;
    
    event PlayerJoined(address indexed player, uint256 lotteryId, uint256 currentPlayerCount);
    event SelectedWinner(address indexed winner, uint256 prize, uint256 indexed lotteryId);
    event LotteryReset(uint256 indexed newLotteryId);
    
    error INSUFFICIENT_BALANCE_ENTRY();
    error JOINED_ALREADY();
    error COMPLETE_GAME_PLAYERS();
    error NoPlayersInLottery();
    error UnauthorizedWinnerSelection();

    constructor() {
        lotteryId = 1;
    }
    

    function joinLottery() external payable {
        if (msg.value != Base_fee) {
            revert INSUFFICIENT_BALANCE_ENTRY();
        }
        
       if (isPlayingCurrently[msg.sender]) {
            revert JOINED_ALREADY();
        }
        
        if (players.length >= MAX) {
            revert COMPLETE_GAME_PLAYERS();
        }
        
        players.push(msg.sender);
        isPlayingCurrently[msg.sender] = true;
        prizePool += msg.value;
        
        emit PlayerJoined(msg.sender, lotteryId, players.length);
        
       if (players.length == MAX) {
            chooseWinner();
        }
    }
    

    function chooseWinner() internal {
        if (players.length == 0) {
            revert NoPlayersInLottery();
        }
        uint256 randomIndex = _generateRandomNumber() % players.length;
        winner = players[randomIndex];
        
        // Transfer prize to winner
        uint256 prize = prizePool;
        prizePool = 0;
        
        emit SelectedWinner(winner, prize, lotteryId);
        
        // Transfer the prize to the winner
        (bool success, ) = payable(winner).call{value: prize}("");
        require(success, "Prize transfer failed");
        
       _resetLottery();
    }
    

    function _generateRandomNumber() internal view returns (uint256) {
        return uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao, 
                    players.length,
                    msg.sender
                )
            )
        );
    }
    

    function _resetLottery() internal {
        for (uint256 i = 0; i < players.length; i++) {
            isPlayingCurrently[players[i]] = false;
        }
        delete players;
        
       lotteryId++;
        
        emit LotteryReset(lotteryId);
    }
    
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
        return isPlayingCurrently[player];
    }
    
    function getSpotsRemaining() external view returns (uint256) {
        return MAX - players.length;
    }
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}