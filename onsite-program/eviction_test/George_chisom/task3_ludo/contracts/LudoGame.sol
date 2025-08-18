// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/ILudoGame.sol";
import "./interfaces/ILudoToken.sol";
import "./libraries/LudoTypes.sol";
import "./libraries/LudoEvents.sol";
import "./libraries/LudoErrors.sol";

contract LudoGame is ILudoGame {
    using LudoTypes for LudoTypes.Game;
    using LudoTypes for LudoTypes.Player;
    
    ILudoToken public ludoToken;
    uint256 public gameCounter;
    uint256 public constant BOARD_SIZE = 52;
    uint256 public constant WINNING_POSITION = 51;

    mapping(uint256 => LudoTypes.Game) public games;
    mapping(address => uint256) public playerCurrentGame;
    mapping(uint256 => mapping(LudoTypes.Color => bool)) public colorTaken;
    
    constructor(address _ludoToken) {
        ludoToken = ILudoToken(_ludoToken);
    }

    function createGame(uint256 _stakeAmount) public returns (uint256) {
        if (_stakeAmount == 0) revert LudoErrors.InvalidStakeAmount();

        gameCounter++;
        LudoTypes.Game storage newGame = games[gameCounter];
        newGame.gameId = gameCounter;
        newGame.state = LudoTypes.GameState.WAITING;
        newGame.stakeAmount = _stakeAmount;
        newGame.createdAt = block.timestamp;

        emit LudoEvents.GameCreated(gameCounter, msg.sender, _stakeAmount);
        return gameCounter;
    }
    
    function registerPlayer(uint256 _gameId, string memory _name, LudoTypes.Color _color) public {
        LudoTypes.Game storage game = games[_gameId];
        if (game.gameId == 0) revert LudoErrors.GameDoesNotExist();
        if (game.state != LudoTypes.GameState.WAITING) revert LudoErrors.GameNotAcceptingPlayers();
        if (game.playerCount >= 4) revert LudoErrors.GameIsFull();
        if (colorTaken[_gameId][_color]) revert LudoErrors.ColorAlreadyTaken();
        if (playerCurrentGame[msg.sender] != 0) revert LudoErrors.PlayerAlreadyInGame();
        if (bytes(_name).length == 0) revert LudoErrors.EmptyName();

        LudoTypes.Player storage newPlayer = game.players[game.playerCount];
        newPlayer.playerAddress = msg.sender;
        newPlayer.name = _name;
        newPlayer.color = _color;
        newPlayer.score = 0;
        newPlayer.position = 0;
        newPlayer.isRegistered = true;
        newPlayer.hasStaked = false;

        colorTaken[_gameId][_color] = true;
        playerCurrentGame[msg.sender] = _gameId;
        game.playerCount++;

        emit LudoEvents.PlayerRegistered(_gameId, msg.sender, _name, _color);
    }
    
    function stakeTokens(uint256 _gameId) public {
        LudoTypes.Game storage game = games[_gameId];
        if (game.gameId == 0) revert LudoErrors.GameDoesNotExist();
        if (game.state != LudoTypes.GameState.WAITING) revert LudoErrors.GameNotAcceptingStakes();

        bool playerFound = false;
        uint8 playerIndex = 0;

        for (uint8 i = 0; i < game.playerCount; i++) {
            if (game.players[i].playerAddress == msg.sender) {
                playerFound = true;
                playerIndex = i;
                break;
            }
        }

        if (!playerFound) revert LudoErrors.PlayerNotRegistered();
        if (game.players[playerIndex].hasStaked) revert LudoErrors.PlayerAlreadyStaked();

        if (!ludoToken.transferFrom(msg.sender, address(this), game.stakeAmount)) {
            revert LudoErrors.TokenTransferFailed();
        }

        game.players[playerIndex].hasStaked = true;
        game.totalPrize += game.stakeAmount;

        bool allStaked = true;
        for (uint8 i = 0; i < game.playerCount; i++) {
            if (!game.players[i].hasStaked) {
                allStaked = false;
                break;
            }
        }

        if (allStaked && game.playerCount >= 2) {
            game.state = LudoTypes.GameState.ACTIVE;
            emit LudoEvents.GameStarted(_gameId, game.stakeAmount);
        }
    }

    function rollDice(uint256 _gameId) public returns (uint256) {
        LudoTypes.Game storage game = games[_gameId];
        if (game.gameId == 0) revert LudoErrors.GameDoesNotExist();
        if (game.state != LudoTypes.GameState.ACTIVE) revert LudoErrors.GameNotActive();
        if (game.players[game.currentPlayerIndex].playerAddress != msg.sender) revert LudoErrors.NotPlayerTurn();

        uint256 diceValue = generateRandomNumber() % 6 + 1;

        emit LudoEvents.DiceRolled(_gameId, msg.sender, diceValue);

        return diceValue;
    }

    function makeMove(uint256 _gameId, uint256 _diceValue) public {
        LudoTypes.Game storage game = games[_gameId];
        if (game.gameId == 0) revert LudoErrors.GameDoesNotExist();
        if (game.state != LudoTypes.GameState.ACTIVE) revert LudoErrors.GameNotActive();
        if (game.players[game.currentPlayerIndex].playerAddress != msg.sender) revert LudoErrors.NotPlayerTurn();
        if (_diceValue < 1 || _diceValue > 6) revert LudoErrors.InvalidDiceValue();

        LudoTypes.Player storage currentPlayer = game.players[game.currentPlayerIndex];
        uint256 newPosition = currentPlayer.position + _diceValue;

        if (newPosition <= WINNING_POSITION) {
            currentPlayer.position = newPosition;
            currentPlayer.score += _diceValue;

            emit LudoEvents.PlayerMoved(_gameId, msg.sender, newPosition);

            if (newPosition == WINNING_POSITION) {
                game.state = LudoTypes.GameState.FINISHED;
                game.winner = msg.sender;

                if (!ludoToken.transfer(msg.sender, game.totalPrize)) {
                    revert LudoErrors.PrizeTransferFailed();
                }

                for (uint8 i = 0; i < game.playerCount; i++) {
                    playerCurrentGame[game.players[i].playerAddress] = 0;
                }

                emit LudoEvents.GameFinished(_gameId, msg.sender, game.totalPrize);
                return;
            }
        }

        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.playerCount;
    }

    function generateRandomNumber() private view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            block.number
        )));
    }

    function getGameInfo(uint256 _gameId) public view returns (
        uint256 gameId_,
        uint8 playerCount,
        uint8 currentPlayerIndex,
        LudoTypes.GameState state,
        uint256 stakeAmount,
        uint256 totalPrize,
        address winner
    ) {
        LudoTypes.Game storage game = games[_gameId];
        return (
            game.gameId,
            game.playerCount,
            game.currentPlayerIndex,
            game.state,
            game.stakeAmount,
            game.totalPrize,
            game.winner
        );
    }

    function getPlayerInfo(uint256 _gameId, uint8 _playerIndex) public view returns (
        address playerAddress,
        string memory name,
        LudoTypes.Color color,
        uint256 score,
        uint256 position,
        bool isRegistered,
        bool hasStaked
    ) {
        if (_playerIndex >= 4) revert LudoErrors.InvalidPlayerIndex();
        LudoTypes.Game storage game = games[_gameId];
        LudoTypes.Player storage player = game.players[_playerIndex];

        return (
            player.playerAddress,
            player.name,
            player.color,
            player.score,
            player.position,
            player.isRegistered,
            player.hasStaked
        );
    }

    function getCurrentPlayer(uint256 _gameId) public view returns (address) {
        LudoTypes.Game storage game = games[_gameId];
        if (game.state != LudoTypes.GameState.ACTIVE) {
            return address(0);
        }
        return game.players[game.currentPlayerIndex].playerAddress;
    }

    function isColorAvailable(uint256 _gameId, LudoTypes.Color _color) public view returns (bool) {
        return !colorTaken[_gameId][_color];
    }
}
