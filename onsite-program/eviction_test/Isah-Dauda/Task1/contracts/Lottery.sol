// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Lottery {
    uint256 public constant ENTRY_FEE = 0.01 ether;
    uint256 public constant MAX_PLAYERS = 10;

    address[] public players;
    mapping(address => bool) public hasEntered;
    uint256 public round;

    event PlayerJoined(address indexed player, uint256 round);
    event WinnerChosen(address indexed winner, uint256 amount, uint256 round);

    function enter() external payable {
        require(msg.value == ENTRY_FEE, "Must send exactly 0.01 ETH");
        require(!hasEntered[msg.sender], "Already entered this round");
        require(players.length < MAX_PLAYERS, "Lottery is full");

        players.push(msg.sender);
        hasEntered[msg.sender] = true;
        emit PlayerJoined(msg.sender, round);

        if (players.length == MAX_PLAYERS) {
            _pickWinner();
        }
    }

    function _pickWinner() internal {
        uint256 rand = uint256(
            keccak256(abi.encodePacked(block.timestamp, block.prevrandao, players))
        );
        uint256 winnerIndex = rand % MAX_PLAYERS;
        address winner = players[winnerIndex];

        uint256 prize = address(this).balance;
        (bool sent, ) = winner.call{value: prize}("");
        require(sent, "Failed to send prize");

        emit WinnerChosen(winner, prize, round);

        for (uint256 i = 0; i < players.length; i++) {
            hasEntered[players[i]] = false;
        }
        delete players;
        round++;
    }

    function getPlayers() external view returns (address[] memory) {
        return players;
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
