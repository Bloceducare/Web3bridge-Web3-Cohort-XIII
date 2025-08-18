// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Lottery {
    error InvalidEntryFee();
    error AlreadyEntered();
    error LotteryFull();
    uint256 public constant ENTRY_FEE = 0.01 ether;
    address[] public players;
    address public winner;
    uint256 public round;
    mapping(address => bool) private entered;

    event PlayerJoined(address indexed player, uint256 round);
    event WinnerChosen(address indexed winner, uint256 prize, uint256 round);

    receive() external payable {
        enter();
    }

    function enter() public payable {
    if (msg.value != ENTRY_FEE) revert InvalidEntryFee();
    if (entered[msg.sender]) revert AlreadyEntered();
    if (players.length >= 10) revert LotteryFull();
        players.push(msg.sender);
        entered[msg.sender] = true;
        emit PlayerJoined(msg.sender, round);
        if (players.length == 10) {
            pickWinner();
        }
    }

    function pickWinner() private {
        uint256 random = uint256(
            keccak256(
                abi.encodePacked(block.prevrandao, block.timestamp, players)
            )
        );
        uint256 winnerIndex = random % players.length;
        winner = players[winnerIndex];
        uint256 prize = address(this).balance;
        payable(winner).transfer(prize);
        emit WinnerChosen(winner, prize, round);
        for (uint256 i = 0; i < players.length; i++) {
            entered[players[i]] = false;
        }
        delete players;
        round++;
    }

    function getPlayers() external view returns (address[] memory) {
        return players;
    }
}
