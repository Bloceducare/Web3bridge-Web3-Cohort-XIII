// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract Lottery {
    uint256 public constant ENTRY_FEE = 0.01 ether;
    uint256 public constant MAX_PLAYERS = 10;

    address[] public players;
    address public recentWinner;
    uint256 public lotteryRound;
    mapping(address => bool) public hasEntered;

    event PlayerEntered(address indexed player, uint256 round, uint256 playerCount);
    event WinnerSelected(address indexed winner, uint256 amount, uint256 round);
    event LotteryReset(uint256 newRound);

    error IncorrectEntryFee();
    error AlreadyEntered();
    error LotteryNotFull();
    error TransferFailed();

    constructor() {
        lotteryRound = 1;
    }

    function enterLottery() external payable {
        if (msg.value != ENTRY_FEE) {
            revert IncorrectEntryFee();
        }

        if (hasEntered[msg.sender]) {
            revert AlreadyEntered();
        }

        players.push(msg.sender);
        hasEntered[msg.sender] = true;

        emit PlayerEntered(msg.sender, lotteryRound, players.length);

        if (players.length == MAX_PLAYERS) {
            _selectWinner();
        }
    }

    function _selectWinner() internal {
        uint256 randomIndex = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    players.length,
                    lotteryRound
                )
            )
        ) % players.length;

        address winner = players[randomIndex];
        recentWinner = winner;
        uint256 prizeAmount = address(this).balance;

        emit WinnerSelected(winner, prizeAmount, lotteryRound);

        (bool success, ) = winner.call{value: prizeAmount}("");
        if (!success) {
            revert TransferFailed();
        }

        _resetLottery();
    }

    function _resetLottery() internal {
        for (uint256 i = 0; i < players.length; i++) {
            hasEntered[players[i]] = false;
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

    function hasPlayerEntered(address player) external view returns (bool) {
        return hasEntered[player];
    }

    function getLotteryInfo() external view returns (
        uint256 playerCount,
        uint256 prizePool,
        uint256 round,
        address winner
    ) {
        return (
            players.length,
            address(this).balance,
            lotteryRound,
            recentWinner
        );
    }
}
