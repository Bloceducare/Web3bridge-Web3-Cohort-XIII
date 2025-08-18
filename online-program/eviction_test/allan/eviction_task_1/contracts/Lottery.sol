// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Lottery {
	uint256 public constant ENTRY_FEE = 0.01 ether;
	uint256 public constant MAX_PLAYERS = 10;

	uint256 public roundId;
	address public lastWinner;

	address[] private currentPlayers;
	mapping(address => bool) private hasEnteredCurrentRound;

	event PlayerJoined(uint256 indexed roundId, address indexed player);
	event WinnerSelected(uint256 indexed roundId, address indexed winner, uint256 prize);

	function getPlayers() external view returns (address[] memory) {
		return currentPlayers;
	}

	function enter() external payable {
		require(msg.value == ENTRY_FEE, "Incorrect entry fee");
		require(!hasEnteredCurrentRound[msg.sender], "Already entered");

		hasEnteredCurrentRound[msg.sender] = true;
		currentPlayers.push(msg.sender);
		emit PlayerJoined(roundId, msg.sender);

		if (currentPlayers.length == MAX_PLAYERS) {
			_pickWinnerAndPayout();
		}
	}

	function _random() private view returns (uint256) {
		return uint256(
			keccak256(
				abi.encodePacked(blockhash(block.number - 1), block.timestamp, currentPlayers.length)
			)
		);
	}

	function _pickWinnerAndPayout() private {
		require(currentPlayers.length == MAX_PLAYERS, "Not enough players");

		uint256 prize = address(this).balance;
		uint256 idx = _random() % currentPlayers.length;
		address winner = currentPlayers[idx];
		lastWinner = winner;

		for (uint256 i = 0; i < currentPlayers.length; i++) {
			hasEnteredCurrentRound[currentPlayers[i]] = false;
		}

		delete currentPlayers;
		uint256 finishedRound = roundId;
		roundId += 1;

		(bool success, ) = winner.call{value: prize}("");
		require(success, "Transfer failed");

		emit WinnerSelected(finishedRound, winner, prize);
	}
} 