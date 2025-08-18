// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Lottery is Ownable {
    uint256 public immutable entryFee;
    uint256 public constant MAX_PLAYERS = 10;

    uint256 public currentRound;
    address[] private players;
    mapping(uint256 => mapping(address => bool)) private hasEntered;
    
    event PlayerJoined(uint256 indexed round, address indexed player, uint256 indexed count);
    event WinnerSelected(uint256 indexed round, address indexed winner, uint256 prize);

    error IncorrectFee();
    error AlreadyJoined();
    error RoundNotFull();
    error TransferFailed();

    constructor(uint256 _entryFee) Ownable(msg.sender) {
        require(_entryFee > 0, "fee=0");
        entryFee = _entryFee;
        currentRound = 1;
    }

    function join() external payable {
        if (msg.value != entryFee) revert IncorrectFee();
        if (hasEntered[currentRound][msg.sender]) revert AlreadyJoined();

        hasEntered[currentRound][msg.sender] = true;
        players.push(msg.sender);
        emit PlayerJoined(currentRound, msg.sender, players.length);

        if (players.length == MAX_PLAYERS) {
            _selectWinnerAndReset();
        }
    }

    function _selectWinnerAndReset() internal {
        if (players.length != MAX_PLAYERS) revert RoundNotFull();

        uint256 prize = address(this).balance;

        uint256 idx = uint256(
            keccak256(
                abi.encodePacked(block.prevrandao, block.timestamp, players, address(this), currentRound)
            )
        ) % players.length;

        address winner = players[idx];

        emit WinnerSelected(currentRound, winner, prize);

        (bool ok, ) = payable(winner).call{value: prize}("");
        if (!ok) revert TransferFailed();

        delete players;
        currentRound += 1;
    }

    function playersInCurrentRound() external view returns (address[] memory) {
        return players;
    }

    function playersCount() external view returns (uint256) {
        return players.length;
    }

    function hasJoined(address user) external view returns (bool) {
        return hasEntered[currentRound][user];
    }

    receive() external payable {
        revert IncorrectFee();
    }
    fallback() external payable {
        revert IncorrectFee();
    }
}