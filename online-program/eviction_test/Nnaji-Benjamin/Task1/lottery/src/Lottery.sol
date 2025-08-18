// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract Lottery {
    address[] public players;
    uint256 public constant ENTRY_FEE = 0.01 ether;
    uint256 public constant PLAYERS_REQUIRED = 10;
    uint256 public lotteryId;

    event PlayerJoined(address indexed player, uint256 indexed currentLotteryId);
    event WinnerSelected(address indexed winner, uint256 amount, uint256 indexed lotteryId);

    modifier correctFee() {
        require(msg.value == ENTRY_FEE, "Incorrect ETH amount sent");
        _;
    }

    modifier uniquePlayer() {
        require(!isPlayer(msg.sender), "Already participated in this lottery");
        _;
    }

    function isPlayer(address _player) public view returns (bool) {
        for (uint256 i = 0; i < players.length; i++) {
            if (players[i] == _player) {
                return true;
            }
        }
        return false;
    }

    function join() external payable correctFee uniquePlayer {
        players.push(msg.sender);
        emit PlayerJoined(msg.sender, lotteryId);

        if (players.length == PLAYERS_REQUIRED) {
            selectWinner();
        }
    }

    function selectWinner() private {
        require(players.length == PLAYERS_REQUIRED, "Not enough players");
        
        uint256 winnerIndex = uint256(
            keccak256(abi.encodePacked(block.timestamp, block.difficulty, players))
        ) % PLAYERS_REQUIRED;
        
        address winner = players[winnerIndex];
        uint256 prizeAmount = address(this).balance;
        
        (bool success, ) = winner.call{value: prizeAmount}("");
        require(success, "Transfer failed");
        
        emit WinnerSelected(winner, prizeAmount, lotteryId);
        
        // Reset for next round
        delete players;
        lotteryId++;
    }

    function getPlayers() external view returns (address[] memory) {
        return players;
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}