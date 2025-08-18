// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Lottery {
    uint256 public constant ENTRY_FEE = 0.01 ether;
    uint256 public constant MAX_PLAYERS = 10;

    address[] public players;
    mapping(address => bool) public hasEntered;
    uint256 public currentRound;

    event PlayerJoined(address indexed player, uint256 round);
    event WinnerSelected(address indexed winner, uint256 amount, uint256 round);
    event LotteryReset(uint256 newRound);

    modifier onlyValidEntry() {
        require(msg.value == ENTRY_FEE, "Incorrect entry fee");
        require(!hasEntered[msg.sender], "Already entered this round");
        require(players.length < MAX_PLAYERS, "Lottery is full");
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

    function _selectWinner() private {
        require(players.length == MAX_PLAYERS, "Not enough players");

        uint256 winnerIndex = _generateRandomNumber() % MAX_PLAYERS;
        address winner = players[winnerIndex];
        uint256 prizePool = address(this).balance;

        emit WinnerSelected(winner, prizePool, currentRound);

        (bool success, ) = winner.call{value: prizePool}("");
        require(success, "Transfer failed");

        _resetLottery();
    }

    function _generateRandomNumber() private view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            players.length,
            currentRound
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

    function getPlayersCount() external view returns (uint256) {
        return players.length;
    }

    function getPlayers() external view returns (address[] memory) {
        return players;
    }

    function getPrizePool() external view returns (uint256) {
        return address(this).balance;
    }
}