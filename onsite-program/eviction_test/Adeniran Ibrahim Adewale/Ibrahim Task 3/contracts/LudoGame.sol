// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract LudoGameWithStaking is ReentrancyGuard {
    IERC20 public ludoToken;
    
    struct Player {
        address addr;
        string name;
        uint8 color; 
        uint8[4] tokens;
        uint8 score;
        uint256 stakedAmount;
    }

    Player[4] public players;
    uint8 public playerCount;
    uint8 public currentPlayer;
    uint8 public lastDice;
    bool public gameStarted;
    bool public gameEnded;
    bool public extraTurn;
    
    uint256 public stakeAmount = 100 * 10**18; // 100 LUDO tokens to join
    uint256 public totalPrizePool;
    address public winner;
    
    uint8[4] startPositions = [1, 14, 27, 40];
    
    event PlayerJoined(address player, string name, uint8 color, uint256 staked);
    event DiceRolled(address player, uint8 roll);
    event TokenMoved(address player, uint8 tokenIndex, uint8 newPosition);
    event GameWon(address winner, uint256 prizeAmount);
    event TokensStaked(address player, uint256 amount);
    event StakeRefunded(address player, uint256 amount);

    constructor(address _ludoToken) {
        ludoToken = IERC20(_ludoToken);
    }

    function joinGame(string memory name, uint8 color) external nonReentrant {
        require(!gameStarted && playerCount < 4 && color < 4, "Cannot join");
        require(ludoToken.balanceOf(msg.sender) >= stakeAmount, "Insufficient tokens");
        
        // Check color not taken
        for(uint8 i = 0; i < playerCount; i++) {
            require(players[i].color != color, "Color taken");
        }
        
        // Transfer stake to contract
        require(ludoToken.transferFrom(msg.sender, address(this), stakeAmount), "Stake failed");
        
        players[playerCount] = Player(
            msg.sender, 
            name, 
            color, 
            [0,0,0,0], 
            0, 
            stakeAmount
        );
        
        totalPrizePool += stakeAmount;
        playerCount++;
        
        emit PlayerJoined(msg.sender, name, color, stakeAmount);
        emit TokensStaked(msg.sender, stakeAmount);
    }

    function startGame() external {
        require(!gameStarted && playerCount >= 2, "Cannot start");
        gameStarted = true;
    }

    function rollDice() external returns (uint8) {
        require(gameStarted && !gameEnded && msg.sender == players[currentPlayer].addr, "Cannot roll");
        
        lastDice = uint8(uint256(keccak256(abi.encodePacked(
            block.timestamp, msg.sender, block.prevrandao
        ))) % 6) + 1;
        
        emit DiceRolled(msg.sender, lastDice);
        return lastDice;
    }

    function moveToken(uint8 tokenIndex) external nonReentrant {
        require(gameStarted && !gameEnded && msg.sender == players[currentPlayer].addr && tokenIndex < 4, "Cannot move");
        
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
                newPos = 53 + (stepsFromStart + lastDice - 52);
            } else {
                newPos = (currentPos + lastDice - 1) % 52 + 1;
                checkCapture(newPos);
            }
        } else if (currentPos <= 58) {
            newPos = currentPos + lastDice;
            require(newPos <= 59, "Can't overshoot");
        }
        
        player.tokens[tokenIndex] = newPos;
        
        if (lastDice == 6) extraTurn = true;
        if (newPos == 59) {
            player.score++;
            if (player.score == 4) {
                winner = msg.sender;
                gameEnded = true;
                
                require(ludoToken.transfer(winner, totalPrizePool), "Prize transfer failed");
                
                emit GameWon(winner, totalPrizePool);
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
                        players[i].tokens[j] = 0;
                        extraTurn = true;
                        break;
                    }
                }
            }
        }
    }

    function refundStakes() external nonReentrant {
        require(gameStarted && !gameEnded, "Game not in refundable state");
        require(block.timestamp > getLastActivity() + 1 hours, "Too early to refund");
        
        for (uint8 i = 0; i < playerCount; i++) {
            if (players[i].stakedAmount > 0) {
                uint256 refundAmount = players[i].stakedAmount;
                players[i].stakedAmount = 0;
                
                require(ludoToken.transfer(players[i].addr, refundAmount), "Refund failed");
                emit StakeRefunded(players[i].addr, refundAmount);
            }
        }
        
        totalPrizePool = 0;
        gameEnded = true;
    }

    function getLastActivity() private view returns (uint256) {
        return block.timestamp; 
    }

    function setStakeAmount(uint256 _stakeAmount) external {
        require(playerCount == 0, "Game already has players");
        stakeAmount = _stakeAmount;
    }

    function getGameState() external view returns (
        address[4] memory addrs,
        string[4] memory names,
        uint8[4] memory colors,
        uint8[4][4] memory tokenPositions,
        uint8[4] memory scores,
        uint256[4] memory stakedAmounts,
        uint8 current,
        uint8 dice,
        bool started,
        bool ended,
        uint256 prizePool,
        address gameWinner
    ) {
        for (uint8 i = 0; i < 4; i++) {
            addrs[i] = players[i].addr;
            names[i] = players[i].name;
            colors[i] = players[i].color;
            scores[i] = players[i].score;
            stakedAmounts[i] = players[i].stakedAmount;
            for (uint8 j = 0; j < 4; j++) {
                tokenPositions[i][j] = players[i].tokens[j];
            }
        }
        return (
            addrs, names, colors, tokenPositions, scores, stakedAmounts,
            currentPlayer, lastDice, gameStarted, gameEnded, totalPrizePool, winner
        );
    }

    function getPlayerStake(address player) external view returns (uint256) {
        for (uint8 i = 0; i < playerCount; i++) {
            if (players[i].addr == player) {
                return players[i].stakedAmount;
            }
        }
        return 0;
    }

    function getTotalPrizePool() external view returns (uint256) {
        return totalPrizePool;
    }
}