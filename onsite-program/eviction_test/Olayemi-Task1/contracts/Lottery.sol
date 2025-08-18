// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Lottery {
    
    address[] public players;
    uint256 public constant ENTRY_FEE = 0.01 ether;
    uint256 public constant MAX_PLAYERS = 10;
    address public winner;
    bool public lotteryActive;

    event PlayerJoined(address indexed player, uint256 round);
    event WinnerSelected(address indexed winner, uint256 prize, uint256 round);

        uint256 public round;

      mapping(uint256 => mapping(address => bool)) public hasEntered;

    constructor() {
        lotteryActive = true;
        round = 1;
    }

       function joinLottery() external payable {
        require(lotteryActive, "Lottery is not active");
        require(msg.value == ENTRY_FEE, "Incorrect entry fee");
        require(players.length < MAX_PLAYERS, "Lottery is full");
        require(!hasEntered[round][msg.sender], "Already entered this round");

         players.push(msg.sender);
        hasEntered[round][msg.sender] = true;

        emit PlayerJoined(msg.sender, round);

       if (players.length == MAX_PLAYERS) {
            selectWinner();
        }
    }

      function selectWinner() private {
        require(players.length == MAX_PLAYERS, "Not enough players");
        uint256 randomIndex = uint256(
            keccak256(abi.encodePacked(block.timestamp, block.prevrandao, players.length))
        ) % MAX_PLAYERS;

        winner = players[randomIndex];
        uint256 prize = address(this).balance;

        
        (bool success, ) = winner.call{value: prize}("");
        require(success, "Prize transfer failed");

        emit WinnerSelected(winner, prize, round);

        resetLottery();
    }

    function resetLottery() private {
        for (uint256 i = 0; i < players.length; i++) {
            hasEntered[round][players[i]] = false;
        }
        delete players;
        round++;
        lotteryActive = true;
    }

    function getPlayers() external view returns (address[] memory) {
        return players;
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}