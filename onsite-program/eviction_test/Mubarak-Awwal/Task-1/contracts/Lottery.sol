// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Lottery {
    uint256 public entryFee = 0.01 ether; 
    uint256 public maxPlayers = 10;  

    address[] public players;      
    mapping(address => bool) public alreadyEntered; 

    // Events
    event PlayerJoined(address player);
    event WinnerChosen(address winner, uint256 amount);

    
    function enter() public payable {
        require(msg.value == entryFee, "Send exactly 0.01 ETH");
        require(!alreadyEntered[msg.sender], "You already joined");
        require(players.length < maxPlayers, "Lottery is full");

        players.push(msg.sender);
        alreadyEntered[msg.sender] = true;

        emit PlayerJoined(msg.sender);

        if (players.length == maxPlayers) {
            pickWinner();
        }
    }

    
    function pickWinner() internal {
        uint256 rand = uint256(
            keccak256(abi.encodePacked(block.timestamp, block.difficulty, players))
        );
        uint256 winnerIndex = rand % players.length;
        address winner = players[winnerIndex];
        uint256 prize = address(this).balance;

        resetLottery();

        (bool success, ) = winner.call{value: prize}("");
        require(success, "Transfer failed");

        emit WinnerChosen(winner, prize);
    }

    // Reset for next round
    function resetLottery() internal {
        for (uint i = 0; i < players.length; i++) {
            alreadyEntered[players[i]] = false;
        }
        delete players;
    }

    // Get current players
    function getPlayers() public view returns (address[] memory) {
        return players;
    }
}
