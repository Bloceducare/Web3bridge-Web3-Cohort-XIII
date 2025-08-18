// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LudoGame {
    enum Color { RED, GREEN, BLUE, YELLOW }
    
    struct Player {
        string name;
        uint256 score;
        Color color;
        bool isRegistered;
        uint256 position;
    }
    
    mapping(address => Player) public players;
    address[] public playerAddresses;
    uint256 public constant MAX_PLAYERS = 4;
  
    uint256 private nonce;
    
    event PlayerRegistered(address player, string name, Color color);
    event DiceRolled(address player, uint256 result);
    event PlayerMoved(address player, uint256 newPosition);
    
    modifier onlyRegistered() {
        require(players[msg.sender].isRegistered, "Player not registered");
        _;
    }
    
    modifier notRegistered() {
        require(!players[msg.sender].isRegistered, "Player already registered");
        _;
    }
    
    function registerPlayer(string memory _name, Color _color) public notRegistered {
        require(playerAddresses.length < MAX_PLAYERS, "Maximum players reached");
        require(bytes(_name).length > 0, "Name cannot be empty");
      
        for (uint256 i = 0; i < playerAddresses.length; i++) {
            require(players[playerAddresses[i]].color != _color, "Color already taken");
        }
        
        players[msg.sender] = Player({
            name: _name,
            score: 0,
            color: _color,
            isRegistered: true,
            position: 0
        });
        playerAddresses.push(msg.sender);
        
        emit PlayerRegistered(msg.sender, _name, _color);
    }
  
    function rollDice() public onlyRegistered returns (uint256) {
        nonce++;
        uint256 result = (uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, nonce))) % 6) + 1;
        
        emit DiceRolled(msg.sender, result);
        return result;
    }
    
    function movePlayer() public onlyRegistered {
        uint256 diceResult = rollDice();
        Player storage player = players[msg.sender];
        
        uint256 newPosition = player.position + diceResult;
        
        if (newPosition >= 100) {
            newPosition = 100;
            player.score += 10;
        }
        
        player.position = newPosition;
        
        emit PlayerMoved(msg.sender, newPosition);
    }
    
    function getPlayerInfo(address _player) public view returns (string memory, uint256, Color, uint256) {
        Player memory player = players[_player];
        require(player.isRegistered, "Player not registered");
        return (player.name, player.score, player.color, player.position);
    }
    
    function getPlayerCount() public view returns (uint256) {
        return playerAddresses.length;
    }
}