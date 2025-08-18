// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Lottery {
    address public owner;
    address[] public players;
    uint256 public entryFee = 0.01 ether;
    uint256 public maxPlayers = 10;
    
    event PlayerJoined(address player);
    event WinnerSelected(address winner, uint256 amount);
    
    constructor() {
        owner = msg.sender;
    }
    
    function enter() public payable {
        require(msg.value == entryFee, "Wrong entry fee");
        require(players.length < maxPlayers, "Lottery is full");
        
        for(uint i = 0; i < players.length; i++) {
            require(players[i] != msg.sender, "Already entered");
        }
        
        players.push(msg.sender);
        emit PlayerJoined(msg.sender);
        
        if(players.length == maxPlayers) {
            pickWinner();
        }
    }
    
    function pickWinner() private {
        uint256 randomIndex = uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty, players))) % players.length;
        address winner = players[randomIndex];
        uint256 prize = address(this).balance;
        
        payable(winner).transfer(prize);
        emit WinnerSelected(winner, prize);
        
        players = new address[](0);
    }
    
    function getPlayers() public view returns (address[] memory) {
        return players;
    }
    
    function getPlayerCount() public view returns (uint256) {
        return players.length;
    }
    
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}