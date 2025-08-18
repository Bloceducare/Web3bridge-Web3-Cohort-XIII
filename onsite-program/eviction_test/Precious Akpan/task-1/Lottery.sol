// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Lottery is Ownable {
    uint256 public entryFee;
    address payable[] public players;
    address public winner;

    event PlayerEntered(address indexed player);
    event WinnerPaid(address indexed winner, uint256 amount);

    constructor(uint256 _entryFee) Ownable(msg.sender) {
        entryFee = _entryFee;
    }

    function enter() external payable {
        require(msg.value == entryFee, "Lottery: Must submit exact entry fee");
        require(!isPlayer(msg.sender), "Lottery: Player already entered");
        players.push(payable(msg.sender));
        emit PlayerEntered(msg.sender);

        if (players.length == 10) {
            pickWinner();
        }
    }

    function isPlayer(address _player) internal view returns (bool) {
        for (uint i = 0; i < players.length; i++) {
            if (players[i] == _player) {
                return true;
            }
        }
        return false;
    }

    function pickWinner() internal {
        require(players.length == 10, "Lottery: Not enough players");
        uint index = uint(keccak256(abi.encodePacked(block.timestamp, block.prevrandao))) % players.length;
        winner = players[index];
        (bool success, ) = winner.call{value: address(this).balance}("");
        require(success, "Lottery: Failed to send money");
        emit WinnerPaid(winner, address(this).balance);
        players = new address payable[](0);
    }

    function getPlayers() external view returns (address payable[] memory) {
        return players;
    }
}
