// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Ludo {
    struct Participant {
        uint256 id;
        address account;
        string name;
        Colors color;
    }
    
    enum Colors {
        RED,
        GREEN,
        BLUE,
        YELLOW
    }
    
    address public owner;

    uint256 public currentGame;

    uint256 public playerCount;

    uint256 constant ENTRY_FEE = 0.01 ether;
    uint256 constant MAX_PLAYERS = 4;
    uint256 public lastDiceRoll;
    uint256 public currentPlayerTurn;
    
    mapping(uint256 => bool) public hasRolledThisTurn;
    
    mapping(uint256 => Participant) public participants;

    mapping(address => bool) public hasJoined;

    mapping(Colors => bool) public colorTaken;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier validEntry(Colors _color) {
        require(msg.value == ENTRY_FEE, "Must pay exactly 0.01 ETH to enter");
        require(playerCount < MAX_PLAYERS, "Maximum 4 players allowed");
        require(!hasJoined[msg.sender], "Cannot join twice in the same game");
        require(!colorTaken[_color], "Color already taken by another player");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        currentGame = 1;
        playerCount = 0;
        currentPlayerTurn = 0;
    }
    
    function register(string memory _name, Colors _color) external payable validEntry(_color) {
        participants[playerCount] = Participant({
            id: playerCount,
            account: msg.sender,
            name: _name,
            color: _color
        });
        
        hasJoined[msg.sender] = true;
        colorTaken[_color] = true;
        playerCount++;
        
        if (playerCount == MAX_PLAYERS) {
            _selectWinner();
        }
    }
    
    function rollDice() external returns (uint256) {
        require(hasJoined[msg.sender], "Must be registered to play");
        require(playerCount == MAX_PLAYERS, "Need 4 players to start game");
        require(participants[currentPlayerTurn].account == msg.sender, "Not your turn");
        require(!hasRolledThisTurn[currentPlayerTurn], "Already rolled dice this turn");
        
        uint256 diceValue = (uint256(keccak256(abi.encodePacked(
            block.prevrandao,
            msg.sender,
            currentPlayerTurn,
            block.number
        ))) % 6) + 1;
        
        lastDiceRoll = diceValue;
        hasRolledThisTurn[currentPlayerTurn] = true;
        currentPlayerTurn = (currentPlayerTurn + 1) % MAX_PLAYERS;
        hasRolledThisTurn[currentPlayerTurn] = false;
        
        return diceValue;
    }
    
    function _selectWinner() internal {
        uint256 randomIndex = uint256(keccak256(abi.encodePacked(
            block.prevrandao,
            currentGame
        ))) % playerCount;
        
        address winner = participants[randomIndex].account;
        uint256 prizeAmount = address(this).balance;
        
        (bool success, ) = payable(winner).call{value: prizeAmount}("");
        require(success, "Transfer failed");
        
        _resetGame();
    }
    
    function _resetGame() internal {
        for (uint256 i = 0; i < playerCount; i++) {
            hasJoined[participants[i].account] = false;
            colorTaken[participants[i].color] = false;
            hasRolledThisTurn[i] = false;
            delete participants[i];
        }
        
        playerCount = 0;
        currentGame++;
        currentPlayerTurn = 0;
        lastDiceRoll = 0;
    }
}