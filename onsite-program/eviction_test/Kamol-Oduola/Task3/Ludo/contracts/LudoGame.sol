// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IERC20.sol";

contract LudoGame {
    enum Color { RED, GREEN, BLUE, YELLOW }

    struct Player {
        string name;
        Color color;
        address addr;
        uint256 score;
        uint8 position; 
        bool registered;
    }

    IERC20 public token;             
    uint256 public stakeAmount;      
    uint8 public constant MAX_PLAYERS = 4;
    uint8 public constant MIN_PLAYERS = 2;
    uint8 public turnIndex;          
    bool public gameStarted;
    address public winner;

    mapping(address => Player) public players;
    address[] public playerAddresses;
    mapping(Color => bool) public colorTaken;

    modifier onlyBeforeStart() {
        require(!gameStarted, "Game already started");
        _;
    }

    modifier onlyRegistered() {
        require(players[msg.sender].registered, "Not registered");
        _;
    }

    modifier onlyTurn() {
        require(playerAddresses[turnIndex] == msg.sender, "Not your turn");
        _;
    }

    constructor(address _token, uint256 _stakeAmount) {
        token = IERC20(_token);
        stakeAmount = _stakeAmount;
    }

    /// Register a player
    function register(string memory _name, Color _color) external onlyBeforeStart {
        require(!players[msg.sender].registered, "Already registered");
        require(playerAddresses.length < MAX_PLAYERS, "Max players reached");
        require(!colorTaken[_color], "Color taken");

        // Transfer stake tokens from user to contract
        require(token.transferFrom(msg.sender, address(this), stakeAmount), "Stake transfer failed");

        players[msg.sender] = Player({
            name: _name,
            color: _color,
            addr: msg.sender,
            score: 0,
            position: 0,
            registered: true
        });

        colorTaken[_color] = true;
        playerAddresses.push(msg.sender);
    }

    /// Start the game (only when enough players are registered)
    function startGame() external onlyBeforeStart {
        require(playerAddresses.length >= MIN_PLAYERS, "Not enough players");
        gameStarted = true;
        turnIndex = 0; // first player starts
    }

    /// Roll dice (1–6) and move
    function rollDice() external onlyRegistered onlyTurn returns (uint8) {
        require(gameStarted, "Game not started");
        require(winner == address(0), "Game already has a winner");

        
        uint8 roll = uint8(uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.prevrandao))) % 6 + 1);

        players[msg.sender].position += roll;
        players[msg.sender].score += roll;

        
        if (players[msg.sender].position >= 100) {
            winner = msg.sender;
            token.transfer(winner, token.balanceOf(address(this)));
        } else {
            
            turnIndex = (turnIndex + 1) % uint8(playerAddresses.length);
        }

        return roll;
    }

    function getPlayers() external view returns (Player[] memory) {
        Player[] memory allPlayers = new Player[](playerAddresses.length);
        for (uint i = 0; i < playerAddresses.length; i++) {
            allPlayers[i] = players[playerAddresses[i]];
        }
        return allPlayers;
    }

   
    function currentTurn() external view returns (address) {
        if (!gameStarted || winner != address(0)) return address(0);
        return playerAddresses[turnIndex];
    }
}
