// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

error InvalidEntryFee(uint256 sent, uint256 required);
error AlreadyEntered(address player);
error LotteryNotFull();
error TransferFailed();

contract Lottery {
    uint256 public constant ENTRY_FEE = 0.01 ether;
    uint256 public constant MAX_PLAYERS = 10;

    address[] public players;
    mapping(address => bool) public hasEntered;
    uint256 public lotteryRound;

    event PlayerJoined(address indexed player, uint256 round);
    event WinnerSelected(address indexed winner, uint256 prize, uint256 round);
    event LotteryReset(uint256 newRound);

    function enterLottery() external payable {
        if (msg.value != ENTRY_FEE) {
            revert InvalidEntryFee(msg.value, ENTRY_FEE);
        }

        if (hasEntered[msg.sender]) {
            revert AlreadyEntered(msg.sender);
        }

        players.push(msg.sender);
        hasEntered[msg.sender] = true;

        emit PlayerJoined(msg.sender, lotteryRound);

        if (players.length == MAX_PLAYERS) {
            _selectWinner();
        }
    }

    function _selectWinner() private {
        uint256 winnerIndex = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    players,
                    lotteryRound
                )
            )
        ) % players.length;

        address winner = players[winnerIndex];
        uint256 prizePool = address(this).balance;

        (bool success, ) = payable(winner).call{value: prizePool}("");
        if (!success) {
            revert TransferFailed();
        }

        emit WinnerSelected(winner, prizePool, lotteryRound);

        _resetLottery();
    }

    function _resetLottery() private {
        for (uint256 i = 0; i < players.length; i++) {
            hasEntered[players[i]] = false;
        }
        delete players;

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
        return address(this).balance;
    }

    function isPlayerEntered(address player) external view returns (bool) {
        return hasEntered[player];
    }
}
