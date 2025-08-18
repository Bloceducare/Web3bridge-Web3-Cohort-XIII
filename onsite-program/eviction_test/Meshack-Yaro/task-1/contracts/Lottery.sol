// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Lottery {
    uint256 public immutable entryFee;
    uint8 public constant MAX_PLAYERS = 10;

    uint256 public roundId;
    address[] private players;
    mapping(address => uint256) public lastJoinedRound;

    event PlayerJoined(uint256 indexed round, address indexed player, uint256 playerCount);
    event WinnerSelected(uint256 indexed round, address indexed winner, uint256 prize);

    constructor(uint256 _entryFee) {
        require(_entryFee > 0, "entry fee = 0");
        entryFee = _entryFee;
        roundId = 0;
    }

    function currentPlayers() external view returns (address[] memory) {
        return players;
    }

    function playersCount() external view returns (uint256) {
        return players.length;
    }

    function currentPot() external view returns (uint256) {
        return address(this).balance;
    }

    function join() external payable {
        require(msg.value == entryFee, "Incorrect fee");
        require(lastJoinedRound[msg.sender] != roundId, "Already entered this round");
        require(players.length < MAX_PLAYERS, "Round full");

        players.push(msg.sender);
        lastJoinedRound[msg.sender] = roundId;

        emit PlayerJoined(roundId, msg.sender, players.length);

        if (players.length == MAX_PLAYERS) {
            _selectWinner();
        }
    }

    function _selectWinner() internal {
        uint256 random = (block.timestamp + block.number + players.length) % players.length;
        address winner = players[random];

        uint256 prize = address(this).balance;
        payable(winner).transfer(prize);

        emit WinnerSelected(roundId, winner, prize);

        delete players;
        roundId += 1;
    }
}
