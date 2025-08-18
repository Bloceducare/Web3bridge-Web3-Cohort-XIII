// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract LudoGame {
    enum Color { RED, GREEN, BLUE, YELLOW }
    
    struct Player {
        string name;
        uint score;
        Color color;
        bool isRegistered;
        uint position;
    }
    
    mapping(address => Player) public players;
    address[] public playerList;
    uint public gameStake = 0.01 ether;
    bool public gameActive;
    uint public totalPot;
    
    function registerPlayer(string memory _name, Color _color) public {
        require(!players[msg.sender].isRegistered, "Already registered");
        require(playerList.length < 4, "Max players reached");
        
        players[msg.sender] = Player(_name, 0, _color, true, 0);
        playerList.push(msg.sender);
    }
    
    function stakeAndStartGame() public payable {
        require(players[msg.sender].isRegistered, "Not registered");
        require(msg.value == gameStake, "Wrong stake amount");
        require(playerList.length >= 2, "Need at least 2 players");
        
        totalPot += msg.value;
        if(totalPot >= gameStake * playerList.length) {
            gameActive = true;
        }
    }
    
    function rollDice() public view returns(uint) {
        require(gameActive, "Game not active");
        require(players[msg.sender].isRegistered, "Not registered");
        
        uint random = uint(keccak256(abi.encodePacked(block.timestamp, msg.sender))) % 6;
        return random + 1;
    }
    
    function makeMove() public {
        require(gameActive, "Game not active");
        require(players[msg.sender].isRegistered, "Not registered");
        
        uint diceRoll = rollDice();
        players[msg.sender].position += diceRoll;
        
        if(players[msg.sender].position >= 100) {
            players[msg.sender].score += 10;
            payable(msg.sender).transfer(totalPot);
            gameActive = false;
            totalPot = 0;
        }
    }
    
    function getPlayerInfo(address _player) public view returns(string memory, uint, Color, uint) {
        Player memory p = players[_player];
        return (p.name, p.score, p.color, p.position);
    }
}