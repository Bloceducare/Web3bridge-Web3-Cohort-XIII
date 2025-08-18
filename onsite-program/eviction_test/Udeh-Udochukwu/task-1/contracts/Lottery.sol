// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Lottery {
    uint256 public constant ENTRY_FEE = 0.01 ether;
    uint256 public constant MAX_PLAYERS = 10;

    address[] public players;
    uint256 public currentRound;
    mapping(address => uint256) private lastRoundEntered;

    event newPlayer(address indexed player);
    event WinnerChosen(address indexed winner);

    function enterLottery() external payable {
        require(msg.value == ENTRY_FEE, "Invalid entry fee");
        require(lastRoundEntered[msg.sender] != currentRound, "Already entered");

        players.push(msg.sender);
        lastRoundEntered[msg.sender] = currentRound;
        emit newPlayer(msg.sender);

        if (players.length == MAX_PLAYERS) {
            pickWinner();
        }
    }

    function getPlayers() external view returns (address[] memory) {
        return players;
    }

    function pickWinner() internal {
        uint256 random = uint256(
            keccak256(
                abi.encodePacked(block.timestamp, block.prevrandao, players, address(this).balance)
            )
        );
        address winner = players[random % players.length];
        uint256 prize = address(this).balance;

        (bool success, ) = payable(winner).call{value: prize}("");
        require(success, "Transfer failed");

        emit WinnerChosen(winner);

        delete players;
        currentRound += 1;
    }
}


