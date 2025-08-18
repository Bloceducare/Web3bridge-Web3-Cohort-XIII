// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IERC20.sol";
contract LudoGame {
    enum Color { RED, GREEN, BLUE, YELLOW }
    
    struct Player {
        address addr;
        string name;
        Color color;
        uint256 score;
        uint8[4] tokenPositions;
        uint8 tokensHome;
    }
    
    IERC20 public ludoToken;
    Player[4] public players;
    uint8 public playerCount;
    uint8 public currentPlayerIndex;
    uint256 public stakeAmount;
    uint256 public totalStaked;
    bool public gameStarted;
    uint256 private nonce;
    
    event PlayerRegistered(address player, string name, Color color);
    event GameStarted(uint256 totalStake);
    event DiceRolled(address player, uint8 roll);
    event TokenMoved(address player, uint8 tokenIndex, uint8 newPosition);
    event PlayerWon(address player, uint256 prize);
    
    constructor(address _ludoToken, uint256 _stakeAmount) {
        ludoToken = IERC20(_ludoToken);
        stakeAmount = _stakeAmount;
    }
    
    function registerPlayer(string calldata _name, Color _color) external {
        require(!gameStarted, "Game already started");
        require(playerCount < 4, "Max players reached");
        
        players[playerCount] = Player({
            addr: msg.sender,
            name: _name,
            color: _color,
            score: 0,
            tokenPositions: [0, 0, 0, 0],
            tokensHome: 0
        });
        
        playerCount++;
        emit PlayerRegistered(msg.sender, _name, _color);
    }
    
    function startGame() external {
        require(!gameStarted, "Game already started");
        require(playerCount >= 2, "Need at least 2 players");
        
        // Collect stakes
        for (uint8 i = 0; i < playerCount; i++) {
            ludoToken.transferFrom(players[i].addr, address(this), stakeAmount);
        }
        
        totalStaked = stakeAmount * playerCount;
        gameStarted = true;
        emit GameStarted(totalStaked);
    }
    
    function rollDice() external returns (uint8) {
        require(gameStarted, "Game not started");
        require(msg.sender == players[currentPlayerIndex].addr, "Not your turn");
        
        uint8 roll = uint8(uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            nonce++
        ))) % 6) + 1;
        
        emit DiceRolled(msg.sender, roll);
        return roll;
    }
    
    function moveToken(uint8 tokenIndex, uint8 diceRoll) external {
        require(gameStarted, "Game not started");
        require(msg.sender == players[currentPlayerIndex].addr, "Not your turn");
        require(tokenIndex < 4, "Invalid token");
        
        Player storage player = players[currentPlayerIndex];
        uint8 currentPos = player.tokenPositions[tokenIndex];
        
        if (currentPos == 0) {
            require(diceRoll == 6, "Need 6 to start");
            player.tokenPositions[tokenIndex] = 1;
        } else {
            uint8 newPos = currentPos + diceRoll;
            if (newPos >= 52) {
                player.tokenPositions[tokenIndex] = 52; // Home
                player.tokensHome++;
                player.score += 10;
                
                if (player.tokensHome == 4) {
                    ludoToken.transfer(msg.sender, totalStaked);
                    gameStarted = false;
                    emit PlayerWon(msg.sender, totalStaked);
                    return;
                }
            } else {
                player.tokenPositions[tokenIndex] = newPos;
            }
        }
        
        emit TokenMoved(msg.sender, tokenIndex, player.tokenPositions[tokenIndex]);
        
        if (diceRoll != 6) {
            currentPlayerIndex = (currentPlayerIndex + 1) % playerCount;
        }
    }
    
    function getPlayer(uint8 index) external view returns (
        address addr,
        string memory name,
        Color color,
        uint256 score,
        uint8[4] memory positions
    ) {
        Player memory player = players[index];
        return (player.addr, player.name, player.color, player.score, player.tokenPositions);
    }
}