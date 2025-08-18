// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract LudoGame {
    struct Player {
        address Address;
        string name;
        uint8 color; 
        uint8[4] token; 
        uint8 score;
    }

    Player[4] public players;
    uint8 public playerCount;
    uint8 public currentPlayer;
    uint8 public lastDice;
    bool public gameStarted;
    bool public extraTurn;
    
    uint8[4] startPositions = [1, 14, 27, 40];
    
    event PlayerJoined(address player, string name, uint8 color);
    event DiceRolled(address player, uint8 roll);
    event TokenMoved(address player, uint8 tokenIndex, uint8 newPosition);
    event GameWon(address winner);

    function joinGame(string memory name, uint8 color) external {
        require(!gameStarted && playerCount < 4 && color < 4);
        
        // Check color not taken
        for(uint8 i = 0; i < playerCount; i++) {
            require(players[i].color != color, "Color taken");
        }
        
        players[playerCount] = Player(msg.sender, name, color, [0,0,0,0], 0);
        playerCount++;
        
        emit PlayerJoined(msg.sender, name, color);
    }

    function startGame() external {
        require(!gameStarted && playerCount >= 2);
        gameStarted = true;
    }

    function rollDice() external returns (uint8) {
        require(gameStarted && msg.sender == players[currentPlayer].addr);
        
        lastDice = uint8(uint256(keccak256(abi.encodePacked(
            block.timestamp, msg.sender, block.prevrandao
        ))) % 6) + 1;
        
        emit DiceRolled(msg.sender, lastDice);
        return lastDice;
    }

    function moveToken(uint8 tokenIndex) external {
        require(gameStarted && msg.sender == players[currentPlayer].addr && tokenIndex < 4);
        
        Player storage player = players[currentPlayer];
        uint8 currentPos = player.tokens[tokenIndex];
        uint8 newPos;
        extraTurn = false;
        
        if (currentPos == 0) {
            require(lastDice == 6, "Need 6 to start");
            newPos = startPositions[player.color];
            extraTurn = true;
        } else if (currentPos <= 52) {
            uint8 stepsFromStart = (currentPos - startPositions[player.color] + 52) % 52;
            
            if (stepsFromStart + lastDice >= 52) {
                // Enter home stretch
                newPos = 53 + (stepsFromStart + lastDice - 52);
            } else {
                // Move on board
                newPos = (currentPos + lastDice - 1) % 52 + 1;
                // Check captures
                checkCapture(newPos);
            }
        } else if (currentPos <= 58) {
            // In home stretch
            newPos = currentPos + lastDice;
            require(newPos <= 59, "Can't overshoot");
        }
        
        player.tokens[tokenIndex] = newPos;
        
        if (lastDice == 6) extraTurn = true;
        if (newPos == 59) {
            player.score++;
            if (player.score == 4) {
                emit GameWon(msg.sender);
                return;
            }
        }
        
        emit TokenMoved(msg.sender, tokenIndex, newPos);
        
        if (!extraTurn) {
            currentPlayer = (currentPlayer + 1) % playerCount;
        }
        lastDice = 0;
    }

    function checkCapture(uint8 position) private {
        for (uint8 i = 0; i < playerCount; i++) {
            if (i != currentPlayer) {
                for (uint8 j = 0; j < 4; j++) {
                    if (players[i].tokens[j] == position) {
                        players[i].tokens[j] = 0; // Send home
                        extraTurn = true;
                        break;
                    }
                }
            }
        }
    }

    function getGameState() external view returns (
        address[4] memory addrs,
        string[4] memory names,
        uint8[4] memory colors,
        uint8[4][4] memory tokenPositions,
        uint8[4] memory scores,
        uint8 current,
        uint8 dice,
        bool started
    ) {
        for (uint8 i = 0; i < 4; i++) {
            addrs[i] = players[i].addr;
            names[i] = players[i].name;
            colors[i] = players[i].color;
            scores[i] = players[i].score;
            for (uint8 j = 0; j < 4; j++) {
                tokenPositions[i][j] = players[i].tokens[j];
            }
        }
        return (addrs, names, colors, tokenPositions, scores, currentPlayer, lastDice, gameStarted);
    }
}