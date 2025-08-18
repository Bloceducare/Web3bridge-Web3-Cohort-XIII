// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ILottery {
    function joinLottery() external payable;
    function selectWinner() external;
}

    error InsufficientFee();
    error MaxPlayersReached();
    error AlreadyJoined();
    error Unauthorized();
    error NoWinnerYet();

contract Lottery {

    uint256 constant ENTRY_FEE = 0.01 ether;
    uint256 constant MAX_PLAYERS = 10;
    address[] public players;
    address public winner;
    bool public isReset;

    mapping(address => bool) public hasJoined;
    
    event PlayerJoined(address indexed player);
    event WinnerSelected(address indexed winner, uint256 prize);


    constructor() {
        isReset = true;
    }

    function joinLottery() external payable {

        if (msg.value != ENTRY_FEE) revert InsufficientFee();
        if (hasJoined[msg.sender]) revert AlreadyJoined();
        if (players.length >= MAX_PLAYERS) revert MaxPlayersReached();

        players.push(msg.sender);
        hasJoined[msg.sender] = true;
        emit PlayerJoined(msg.sender);

        if (players.length == MAX_PLAYERS) {
            selectWinner();
        }
    }

    function selectWinner() public {

        if (msg.sender != address(this)) revert Unauthorized();
        if (players.length < MAX_PLAYERS) revert NoWinnerYet();

        winner = players[block.timestamp % players.length];
        uint256 prize = address(this).balance;
        (bool sent, ) = winner.call{value: prize}("");
        require(sent, "Transfer failed");
        emit WinnerSelected(winner, prize);

        resetLottery();
    }

    function resetLottery() internal {
        for (uint i = 0; i < players.length; i++) {
            hasJoined[players[i]] = false;
        }
        delete players;
        isReset = true;
    }
}









// please using custom error, interfaces, events, mappping and others to build a simple lottery smart contract, please also keep it simple and dont add comment, Write a test and I am deploying to liskTestnet

