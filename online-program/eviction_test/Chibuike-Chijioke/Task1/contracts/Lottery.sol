// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "./interfaces/ILottery.sol";

contract Lottery is ILottery {
    uint256 public constant ENTRY_FEE = 0.01 ether;
    uint8 public constant MAX_PLAYERS = 10;

    uint256 public roundNumber;
    address[] private participants;
    mapping(address => bool) private hasEntered;

    struct Player {
        address addr;
        bool entered;
    }

    event PlayerJoined(address indexed player, uint256 indexed round);
    event WinnerSelected(
        address indexed winner,
        uint256 indexed round,
        uint256 prize
    );

    modifier onlyNewPlayer() {
        require(!hasEntered[msg.sender], "Already entered this round");
        _;
    }

    modifier exactFee() {
        require(msg.value == ENTRY_FEE, "Invalid entry fee");
        _;
    }

    modifier lotteryOpen() {
        require(participants.length < MAX_PLAYERS, "Lottery full");
        _;
    }

    constructor() {
        roundNumber = 1;
    }

    function enterLottery()
        external
        payable
        exactFee
        onlyNewPlayer
        lotteryOpen
    {
        participants.push(msg.sender);
        hasEntered[msg.sender] = true;

        emit PlayerJoined(msg.sender, roundNumber);

        if (participants.length == MAX_PLAYERS) {
            _selectWinner();
        }
    }

    function _selectWinner() private {
        uint256 randomIndex = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    participants
                )
            )
        ) % MAX_PLAYERS;

        address winner = participants[randomIndex];
        uint256 prize = address(this).balance;

        payable(winner).transfer(prize);
        emit WinnerSelected(winner, roundNumber, prize);

        for (uint8 i = 0; i < participants.length; i++) {
            hasEntered[participants[i]] = false;
        }

        delete participants;
        roundNumber += 1;
    }

    function getParticipants()
        external
        view
        override
        returns (address[] memory)
    {
        return participants;
    }

    function getPrizePool() external view override returns (uint256) {
        return address(this).balance;
    }

    function getCurrentRound() external view override returns (uint256) {
        return roundNumber;
    }
}
