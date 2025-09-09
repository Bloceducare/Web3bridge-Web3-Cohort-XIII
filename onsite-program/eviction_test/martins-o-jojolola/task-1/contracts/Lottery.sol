// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Lottery {
    uint256 public constant ENTRY_FEE = 0.01 ether;
    uint256 public constant MAX_PLAYERS = 10;

    address[] public players;
    address public winner;
    uint256 public lotteryRound;

    mapping(address => bool) public hasJoined;

    event PlayerJoined(
        address indexed player,
        uint256 indexed round,
        uint256 playerCount
    );
    event WinnerSelected(
        address indexed winner,
        uint256 indexed round,
        uint256 prizePool
    );
    event LotteryReset(uint256 indexed newRound);

    error IncorrectEntryFee();
    error AlreadyJoined();
    error LotteryNotFull();
    error TransferFailed();

    constructor() {
        lotteryRound = 1;
    }

    function joinLottery() external payable {
        if (msg.value != ENTRY_FEE) {
            revert IncorrectEntryFee();
        }

        if (hasJoined[msg.sender]) {
            revert AlreadyJoined();
        }

        players.push(msg.sender);
        hasJoined[msg.sender] = true;

        emit PlayerJoined(msg.sender, lotteryRound, players.length);

        if (players.length == MAX_PLAYERS) {
            _selectWinner();
        }
    }

    function _selectWinner() internal {
        uint256 randomIndex = uint256(
            keccak256(
                abi.encodePacked(block.timestamp, block.difficulty, players)
            )
        ) % players.length;

        winner = players[randomIndex];
        uint256 prizePool = address(this).balance;

        emit WinnerSelected(winner, lotteryRound, prizePool);

        (bool success, ) = winner.call{value: prizePool}("");
        if (!success) {
            revert TransferFailed();
        }

        _resetLottery();
    }

    function _resetLottery() internal {
        for (uint256 i = 0; i < players.length; i++) {
            hasJoined[players[i]] = false;
        }
        delete players;

        lotteryRound++;

        emit LotteryReset(lotteryRound);
    }

    function getPlayerCount() external view returns (uint256) {
        return players.length;
    }

    function getPlayers() external view returns (address[] memory) {
        return players;
    }

    function getPrizePool() external view returns (uint256) {
        return address(this).balance;
    }

    function hasPlayerJoined(address player) external view returns (bool) {
        return hasJoined[player];
    }

    function getCurrentRound() external view returns (uint256) {
        return lotteryRound;
    }

    function getLastWinner() external view returns (address) {
        return winner;
    }
}
