// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {LotteryErrors} from "./errors/LotteryErrors.sol";

contract Lottery {
    uint256 public immutable entryFeeWei;
    uint256 public constant MAX_PLAYERS_PER_ROUND = 10;

    address[] public players;
    uint256 public currentRound;
    mapping(address => uint256) private lastRoundEntered;

    event PlayerJoined(address indexed player, uint256 indexed round);
    event WinnerSelected(address indexed winner, uint256 amount, uint256 indexed round);

    constructor(uint256 _entryFeeWei) payable {
        entryFeeWei = _entryFeeWei;
        currentRound = 1;
    }

    function enterLottery() external payable {
        if (msg.value != entryFeeWei) revert LotteryErrors.InvalidEntryFee();
        if (lastRoundEntered[msg.sender] == currentRound) revert LotteryErrors.AlreadyEnteredThisRound();

        lastRoundEntered[msg.sender] = currentRound;
        players.push(msg.sender);
        emit PlayerJoined(msg.sender, currentRound);

        if (players.length == MAX_PLAYERS_PER_ROUND) {
            _selectWinnerAndReset();
        }
    }

    function getPlayers() external view returns (address[] memory) {
        return players;
    }

    function playersCount() external view returns (uint256) {
        return players.length;
    }

    function _selectWinnerAndReset() internal {
        uint256 prize = address(this).balance;
        uint256 winnerIndex = _pseudoRandom() % players.length;
        address winner = players[winnerIndex];

        emit WinnerSelected(winner, prize, currentRound);

        delete players;
        unchecked {
            currentRound += 1;
        }

        (bool success, ) = payable(winner).call{value: prize}("");
        require(success, "Transfer failed");
    }

    function _pseudoRandom() private view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, players, address(this), currentRound)));
    }
}


