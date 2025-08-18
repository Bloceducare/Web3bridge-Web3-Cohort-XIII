// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";


contract LudoGame is Ownable, ReentrancyGuard {
    IERC20 public immutable ludoToken;

    uint256 public constant BOARD_SIZE = 52;
    uint256 public constant HOME_PATH_SIZE = 6;
    uint256 public constant MAX_PLAYERS = 4;
    uint256 public constant TOKENS_PER_PLAYER = 4;
    uint256 public constant FINAL_POSITION = 57; // End of home path

    enum Color { RED, GREEN, BLUE, YELLOW }
    enum GameState { WAITING, IN_PROGRESS, FINISHED }

    struct Player {
        address playerAddress;
        string name;
        Color color;
        uint256 score;
        uint256[TOKENS_PER_PLAYER] tokens; 
        bool registered;
        bool staked;
    }

    struct Game {
        uint256 id;
        Player[MAX_PLAYERS] players;
        uint256 playerCount;
        uint256 currentTurnIndex;
        uint256 stakeAmount;
        uint256 prizePool;
        GameState state;
        address winner;
        uint256 createdAt;
        bool[] colorTaken; 
    }

    mapping(uint256 => Game) public games;
    mapping(address => uint256) public activeGameOf; 
    uint256 public totalGames;
    uint256 public defaultStakeAmount = 100 * 1e18;

    mapping(Color => uint256) public startSquare;

    event GameCreated(uint256 indexed gameId, uint256 stake);
    event PlayerJoined(uint256 indexed gameId, address indexed player, string name, Color color);
    event PlayerStaked(uint256 indexed gameId, address indexed player, uint256 amount);
    event GameStarted(uint256 indexed gameId);
    event DiceRolled(uint256 indexed gameId, address indexed player, uint256 dice);
    event TokenMoved(uint256 indexed gameId, address indexed player, uint256 tokenIndex, uint256 fromPos, uint256 toPos);
    event GameEnded(uint256 indexed gameId, address indexed winner, uint256 prize);

    modifier validGame(uint256 gameId) {
        require(gameId > 0 && gameId <= totalGames, "Invalid game ID");
        _;
    }

    modifier onlyGamePlayer(uint256 gameId) {
        require(activeGameOf[msg.sender] == gameId, "Not a player in this game");
        _;
    }

    modifier gameOngoing(uint256 gameId) {
        require(games[gameId].state == GameState.IN_PROGRESS, "Game not active");
        _;
    }

    modifier onlyTurn(uint256 gameId) {
        require(games[gameId].players[games[gameId].currentTurnIndex].playerAddress == msg.sender, "Not your turn");
        _;
    }

    constructor(address _token) Ownable(msg.sender) {
        ludoToken = IERC20(_token);

        startSquare[Color.RED] = 1;
        startSquare[Color.GREEN] = 14;
        startSquare[Color.BLUE] = 27;
        startSquare[Color.YELLOW] = 40;
    }


    function createGame(uint256 stake) external {
        require(stake > 0, "Stake must be > 0");

        totalGames++;
        Game storage game = games[totalGames];
        game.id = totalGames;
        game.stakeAmount = stake;
        game.state = GameState.WAITING;
        game.createdAt = block.timestamp;
        // game.colorTaken = bool;

        emit GameCreated(totalGames, stake);
    }

    function joinGame(uint256 gameId, string memory name, Color color)
        external
        validGame(gameId)
    {
        Game storage game = games[gameId];
        require(game.state == GameState.WAITING, "Game already started/ended");
        require(game.playerCount < MAX_PLAYERS, "Game full");
        require(!game.colorTaken[uint256(color)], "Color taken");
        require(activeGameOf[msg.sender] == 0, "Already in a game");
        require(bytes(name).length > 0, "Name required");

        Player storage player = game.players[game.playerCount];
        player.playerAddress = msg.sender;
        player.name = name;
        player.color = color;
        player.registered = true;

        for (uint256 i = 0; i < TOKENS_PER_PLAYER; i++) {
            player.tokens[i] = 0; // all at home
        }

        game.colorTaken[uint256(color)] = true;
        game.playerCount++;
        activeGameOf[msg.sender] = gameId;

        emit PlayerJoined(gameId, msg.sender, name, color);
    }

    function stake(uint256 gameId)
        external
        validGame(gameId)
        onlyGamePlayer(gameId)
        nonReentrant
    {
        Game storage game = games[gameId];
        require(game.state == GameState.WAITING, "Game not accepting stakes");

        uint256 idx = playerIndex(gameId, msg.sender);
        require(!game.players[idx].staked, "Already staked");

        require(ludoToken.transferFrom(msg.sender, address(this), game.stakeAmount), "Stake transfer failed");

        game.players[idx].staked = true;
        game.prizePool += game.stakeAmount;

        emit PlayerStaked(gameId, msg.sender, game.stakeAmount);

        if (everyoneStaked(gameId)) _start(gameId);
    }

    function _start(uint256 gameId) internal {
        Game storage game = games[gameId];
        game.state = GameState.IN_PROGRESS;
        game.currentTurnIndex = 0;
        emit GameStarted(gameId);
    }

    function rollAndPlay(uint256 gameId, uint256 tokenIdx)
        external
        validGame(gameId)
        gameOngoing(gameId)
        onlyGamePlayer(gameId)
        onlyTurn(gameId)
    {
        require(tokenIdx < TOKENS_PER_PLAYER, "Invalid token");

        uint256 dice = _randomDice();
        emit DiceRolled(gameId, msg.sender, dice);

        bool moved = _move(gameId, tokenIdx, dice);

        if (_won(gameId)) {
            _end(gameId);
            return;
        }

        if (dice != 6 && moved) _nextTurn(gameId);
    }


    function _randomDice() internal view returns (uint256) {
        return (uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender, totalGames))) % 6) + 1;
    }

    function _move(uint256 gameId, uint256 tokenIdx, uint256 dice) internal returns (bool) {
        Game storage game = games[gameId];
        Player storage player = game.players[playerIndex(gameId, msg.sender)];

        uint256 current = player.tokens[tokenIdx];
        uint256 target = _newPosition(player.color, current, dice);

        if (!_validMove(current, target, dice)) return false;
        if (_ownTokenOnSquare(gameId, playerIndex(gameId, msg.sender), target, tokenIdx)) return false;

        _capture(gameId, playerIndex(gameId, msg.sender), target);

        player.tokens[tokenIdx] = target;
        emit TokenMoved(gameId, msg.sender, tokenIdx, current, target);
        return true;
    }

    function _newPosition(Color color, uint256 current, uint256 dice) internal view returns (uint256) {
        if (current == 0) return dice == 6 ? startSquare[color] : 0;

        if (current >= 1 && current <= BOARD_SIZE) {
            uint256 homeStart = _homeStart(color);
            uint256 next = current + dice;

            if (current < homeStart && next >= homeStart) {
                return BOARD_SIZE + 1 + (next - homeStart);
            }

            return next > BOARD_SIZE ? ((next - 1) % BOARD_SIZE) + 1 : next;
        }

        if (current > BOARD_SIZE && current < FINAL_POSITION) {
            uint256 next = current + dice;
            return next > FINAL_POSITION ? current : next;
        }

        return current;
    }

    function _homeStart(Color color) internal pure returns (uint256) {
        if (color == Color.RED) return 51;
        if (color == Color.GREEN) return 12;
        if (color == Color.BLUE) return 25;
        if (color == Color.YELLOW) return 38;
        return 0;
    }

    function _validMove(uint256 current, uint256 target, uint256 dice) internal pure returns (bool) {
        if (current == 0 && dice != 6) return false;
        if (current >= FINAL_POSITION) return false;
        return current != target;
    }

    function _ownTokenOnSquare(uint256 gameId, uint256 pIdx, uint256 pos, uint256 skipIdx) internal view returns (bool) {
        Player storage p = games[gameId].players[pIdx];
        for (uint256 i = 0; i < TOKENS_PER_PLAYER; i++) {
            if (i != skipIdx && p.tokens[i] == pos) return true;
        }
        return false;
    }

    function _capture(uint256 gameId, uint256 pIdx, uint256 pos) internal {
        if (pos == 0 || pos > BOARD_SIZE) return;
        Game storage g = games[gameId];

        for (uint256 i = 0; i < g.playerCount; i++) {
            if (i == pIdx) continue;
            Player storage opp = g.players[i];
            for (uint256 j = 0; j < TOKENS_PER_PLAYER; j++) {
                if (opp.tokens[j] == pos) opp.tokens[j] = 0;
            }
        }
    }

    function _won(uint256 gameId) internal view returns (bool) {
        Player storage p = games[gameId].players[games[gameId].currentTurnIndex];
        for (uint256 i = 0; i < TOKENS_PER_PLAYER; i++) {
            if (p.tokens[i] < FINAL_POSITION) return false;
        }
        return true;
    }

    function _end(uint256 gameId) internal {
        Game storage g = games[gameId];
        g.state = GameState.FINISHED;
        g.winner = g.players[g.currentTurnIndex].playerAddress;
        g.players[g.currentTurnIndex].score += g.prizePool;

        ludoToken.transfer(g.winner, g.prizePool);

        for (uint256 i = 0; i < g.playerCount; i++) {
            activeGameOf[g.players[i].playerAddress] = 0;
        }

        emit GameEnded(gameId, g.winner, g.prizePool);
    }

    function _nextTurn(uint256 gameId) internal {
        Game storage g = games[gameId];
        g.currentTurnIndex = (g.currentTurnIndex + 1) % g.playerCount;
    }

    function everyoneStaked(uint256 gameId) internal view returns (bool) {
        Game storage g = games[gameId];
        for (uint256 i = 0; i < g.playerCount; i++) {
            if (!g.players[i].staked) return false;
        }
        return true;
    }

    function playerIndex(uint256 gameId, address player) internal view returns (uint256) {
        Game storage g = games[gameId];
        for (uint256 i = 0; i < g.playerCount; i++) {
            if (g.players[i].playerAddress == player) return i;
        }
        revert("Player not found");
    }


    function gameInfo(uint256 gameId)
        external
        view
        validGame(gameId)
        returns (uint256, uint256, uint256, uint256, GameState, address, uint256)
    {
        Game storage g = games[gameId];
        return (g.id, g.playerCount, g.stakeAmount, g.prizePool, g.state, g.winner, g.currentTurnIndex);
    }

    function playerInfo(uint256 gameId, uint256 idx)
        external
        view
        validGame(gameId)
        returns (address, string memory, Color, uint256, uint256[TOKENS_PER_PLAYER] memory, bool)
    {
        require(idx < games[gameId].playerCount, "Invalid index");
        Player storage p = games[gameId].players[idx];
        return (p.playerAddress, p.name, p.color, p.score, p.tokens, p.staked);
    }

    function currentPlayer(uint256 gameId) external view validGame(gameId) returns (address) {
        Game storage g = games[gameId];
        if (g.state != GameState.IN_PROGRESS) return address(0);
        return g.players[g.currentTurnIndex].playerAddress;
    }

    function setDefaultStake(uint256 amount) external onlyOwner {
        defaultStakeAmount = amount;
    }

    function emergencyWithdraw() external onlyOwner {
        uint256 bal = ludoToken.balanceOf(address(this));
        ludoToken.transfer(owner(), bal);
    }
}
