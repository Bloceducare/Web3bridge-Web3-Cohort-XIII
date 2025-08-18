// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LudoGame {
    enum Color { RED, GREEN, BLUE, YELLOW }
    
    struct Player {
        string name;
        Color color;
        uint256 score;
        bool registered;
        address wallet;
    }
    
    IERC20 public gameToken;
    address public owner;
    bool public gameStarted;
    uint256 public playerCount;
    uint256 public currentPlayerIndex;
    uint256 public stakeAmount;
    
    mapping(Color => bool) public colorTaken;
    mapping(address => Player) public players;
    address[] public playerAddresses;
    
    event PlayerRegistered(address player, string name, Color color);
    event DiceRolled(address player, uint256 roll);
    event GameStarted(uint256 stakeAmount);
    event GameEnded(address winner, uint256 prize);
    event FundsStaked(address player, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyRegistered() {
        require(players[msg.sender].registered, "Player not registered");
        _;
    }
    
    modifier gameNotStarted() {
        require(!gameStarted, "Game has already started");
        _;
    }
    
    modifier gameIsStarted() {
        require(gameStarted, "Game has not started");
        _;
    }
    
    constructor(address _tokenAddress, uint256 _stakeAmount) {
        owner = msg.sender;
        gameToken = IERC20(_tokenAddress);
        stakeAmount = _stakeAmount;
    }
    
    function registerPlayer(string memory _name, Color _color) external gameNotStarted {
        require(!players[msg.sender].registered, "Player already registered");
        require(playerCount < 4, "Maximum players reached");
        require(!colorTaken[_color], "Color already taken");
        
        players[msg.sender] = Player({
            name: _name,
            color: _color,
            score: 0,
            registered: true,
            wallet: msg.sender
        });
        
        colorTaken[_color] = true;
        playerAddresses.push(msg.sender);
        playerCount++;
        
        emit PlayerRegistered(msg.sender, _name, _color);
    }
    
    function stakeTokens() external onlyRegistered gameNotStarted {
        require(gameToken.balanceOf(msg.sender) >= stakeAmount, "Insufficient token balance");
        require(gameToken.allowance(msg.sender, address(this)) >= stakeAmount, "Token allowance not set");
        
        bool success = gameToken.transferFrom(msg.sender, address(this), stakeAmount);
        require(success, "Token transfer failed");
        
        emit FundsStaked(msg.sender, stakeAmount);
    }
    
    function startGame() external onlyOwner gameNotStarted {
        require(playerCount >= 2, "Need at least 2 players to start");
        
        // Check all players have staked
        for (uint i = 0; i < playerAddresses.length; i++) {
            require(gameToken.balanceOf(address(this)) >= stakeAmount * playerCount, "Not all players have staked");
        }
        
        gameStarted = true;
        currentPlayerIndex = 0;
        
        emit GameStarted(stakeAmount);
    }
    
    function rollDice() external onlyRegistered gameIsStarted returns(uint256) {
        require(playerAddresses[currentPlayerIndex] == msg.sender, "Not your turn");
        
        uint256 roll = _random() % 6 + 1;
        players[msg.sender].score += roll;
        
        emit DiceRolled(msg.sender, roll);
        
        // Move to next player
        currentPlayerIndex = (currentPlayerIndex + 1) % playerCount;
        
        return roll;
    }
    
    function declareWinner() external onlyOwner gameIsStarted {
        address winner = playerAddresses[0];
        uint256 highestScore = players[winner].score;
        
        // Find player with highest score
        for (uint i = 1; i < playerAddresses.length; i++) {
            if (players[playerAddresses[i]].score > highestScore) {
                winner = playerAddresses[i];
                highestScore = players[winner].score;
            }
        }
        
        uint256 prize = stakeAmount * playerCount;
        gameToken.transfer(winner, prize);
        
        emit GameEnded(winner, prize);
        
        // Reset game state
        _resetGame();
    }
    
    function _random() private view returns(uint256) {
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender))) % 6 + 1;
    }
    
    function _resetGame() private {
        for (uint i = 0; i < playerAddresses.length; i++) {
            delete colorTaken[players[playerAddresses[i]].color];
            delete players[playerAddresses[i]];
        }
        
        delete playerAddresses;
        playerCount = 0;
        gameStarted = false;
        currentPlayerIndex = 0;
    }
    
    function getPlayerCount() external view returns(uint256) {
        return playerCount;
    }
    
    function getCurrentPlayer() external view returns(address) {
        return playerAddresses[currentPlayerIndex];
    }
    
    function getPlayerInfo(address _player) external view returns(string memory, Color, uint256, bool) {
        Player memory player = players[_player];
        return (player.name, player.color, player.score, player.registered);
    }
}