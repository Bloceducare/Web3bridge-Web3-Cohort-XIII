// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./ERC20.sol";

contract LudoArena {
    AuroraToken public token;
    address public owner;

    enum Color {
        RED,
        GREEN,
        BLUE,
        YELLOW
    }

    uint8 public constant MAX_PLAYERS = 4;
    uint8 public constant MIN_PLAYERS = 2;
    uint8 public constant GOAL_POSITION = 57;

    uint256 public stakeAmount;
    uint256 public pot;

    uint256 private rngNonce;

    bool public started;
    uint8 public currentTurnIndex;

    struct Player {
        address addr;
        string name;
        Color color;
        bool registered;
        bool staked;
        uint8 position;
        bool finished;
    }

    Player[] public players;
    mapping(address => uint8) public playerIndex;

    // events
    event PlayerRegistered(address indexed player, string name, Color color);
    event PlayerStaked(address indexed player, uint256 amount);
    event GameStarted();
    event DiceRolled(address indexed player, uint8 roll);
    event PlayerMoved(address indexed player, uint8 fromPos, uint8 toPos);
    event PlayerWon(address indexed winner, uint256 prize);

    modifier onlyOwner() {
        require(msg.sender == owner, "LudoArena: only owner");
        _;
    }

    modifier onlyRegistered() {
        require(isRegistered(msg.sender), "LudoArena: not registered");
        _;
    }

    modifier onlyCurrentPlayer() {
        require(players.length > 0, "LudoArena: no players");
        require(
            msg.sender == players[currentTurnIndex].addr,
            "LudoArena: not your turn"
        );
        _;
    }

    modifier whenNotStarted() {
        require(!started, "LudoArena: already started");
        _;
    }

    modifier whenStarted() {
        require(started, "LudoArena: not started");
        _;
    }

    constructor(address tokenAddress, uint256 _stakeAmount) {
        token = AuroraToken(tokenAddress);
        owner = msg.sender;
        stakeAmount = _stakeAmount;
        rngNonce = 0;
        started = false;
        currentTurnIndex = 0;
        pot = 0;
    }

    function register(
        string calldata playerName,
        Color color
    ) external whenNotStarted {
        require(!isRegistered(msg.sender), "LudoArena: already registered");
        require(players.length < MAX_PLAYERS, "LudoArena: max players reached");

        for (uint8 i = 0; i < players.length; i++) {
            require(
                players[i].color != color,
                "LudoArena: color already taken"
            );
        }

        Player memory p = Player({
            addr: msg.sender,
            name: playerName,
            color: color,
            registered: true,
            staked: false,
            position: 0,
            finished: false
        });

        players.push(p);
        playerIndex[msg.sender] = uint8(players.length);
        emit PlayerRegistered(msg.sender, playerName, color);
    }

    // stake tokens to join the pot. Player must approve contract first.
    function stake() external whenNotStarted onlyRegistered {
        uint8 idx = _getPlayerIdx(msg.sender);
        require(!players[idx].staked, "LudoArena: already staked");
        require(
            token.transferFrom(msg.sender, address(this), stakeAmount),
            "LudoArena: token transfer failed"
        );
        players[idx].staked = true;
        pot += stakeAmount;
        emit PlayerStaked(msg.sender, stakeAmount);
    }

    // start the game. Requires at least MIN_PLAYERS and all registered players must have staked.
    function startGame() external whenNotStarted {
        require(players.length >= MIN_PLAYERS, "LudoArena: not enough players");
        for (uint8 i = 0; i < players.length; i++) {
            require(players[i].staked, "LudoArena: all players must stake");
        }
        started = true;
        currentTurnIndex = 0;
        emit GameStarted();
    }

    // roll dice (1..6) and make a move for current player. Game must be started.
    function rollDiceAndMove() external whenStarted onlyCurrentPlayer {
        uint8 roll = _rollDice();
        emit DiceRolled(msg.sender, roll);
        _applyMove(currentTurnIndex, roll);
        if (started) {
            _advanceTurn();
        }
    }

    function rollDiceWithSeed(
        uint256 seed
    ) external whenStarted onlyCurrentPlayer returns (uint8) {
        uint8 roll = uint8(
            (uint256(
                keccak256(
                    abi.encodePacked(
                        block.timestamp,
                        block.prevrandao,
                        msg.sender,
                        rngNonce,
                        seed
                    )
                )
            ) % 6) + 1
        );
        rngNonce++;
        emit DiceRolled(msg.sender, roll);
        _applyMove(currentTurnIndex, roll);
        if (started) {
            _advanceTurn();
        }
        return roll;
    }

    function _rollDice() internal returns (uint8) {
        uint8 roll = uint8(
            (uint256(
                keccak256(
                    abi.encodePacked(
                        block.timestamp,
                        block.prevrandao,
                        msg.sender,
                        rngNonce
                    )
                )
            ) % 6) + 1
        );
        rngNonce++;
        return roll;
    }

    // apply movement rules for player at players[idx]
    function _applyMove(uint8 idx, uint8 roll) internal {
        Player storage p = players[idx];
        uint8 fromPos = p.position;

        if (p.finished) {
            return;
        }

        if (p.position == 0) {
            if (roll == 6) {
                p.position = 1;
            } else {
                emit PlayerMoved(p.addr, fromPos, p.position);
                return;
            }
        } else {
            uint8 tentative = p.position + roll;
            if (tentative > GOAL_POSITION) {
                emit PlayerMoved(p.addr, fromPos, p.position);
                return;
            } else {
                p.position = tentative;
            }
        }

        emit PlayerMoved(p.addr, fromPos, p.position);

        if (p.position == GOAL_POSITION) {
            p.finished = true;
            _declareWinner(p.addr);
        }
    }

    // declare winner -> transfer pot to winner, reset game
    function _declareWinner(address winner) internal {
        uint256 prize = pot;
        pot = 0;
        started = false;
        require(
            token.transfer(winner, prize),
            "LudoArena: prize transfer failed"
        );
        emit PlayerWon(winner, prize);

        // reset players array state for new game
        for (uint8 i = 0; i < players.length; i++) {
            players[i].staked = false;
            players[i].position = 0;
            players[i].finished = false;
        }
    }

    // advance turn to next non-finished player
    function _advanceTurn() internal {
        if (players.length == 0) return;
        uint8 next = currentTurnIndex;
        for (uint8 i = 1; i <= players.length; i++) {
            uint8 candidate = uint8((currentTurnIndex + i) % players.length);
            if (!players[candidate].finished) {
                next = candidate;
                break;
            }
        }
        currentTurnIndex = next;
    }

    // helper to check registration
    function isRegistered(address who) public view returns (bool) {
        return playerIndex[who] != 0;
    }

    function _getPlayerIdx(address who) internal view returns (uint8) {
        uint8 idx1 = playerIndex[who];
        require(idx1 != 0, "LudoArena: not registered");
        return idx1 - 1;
    }

    // view players count
    function playersCount() external view returns (uint256) {
        return players.length;
    }

    // helper to get player info by index
    function getPlayer(
        uint8 idx
    )
        external
        view
        returns (
            address addr,
            string memory name,
            Color color,
            bool staked,
            uint8 position,
            bool finished
        )
    {
        Player storage p = players[idx];
        return (p.addr, p.name, p.color, p.staked, p.position, p.finished);
    }

    // owner can withdraw accidentally stuck tokens (only when game not started)
    function rescueTokens(
        address to,
        uint256 amount
    ) external onlyOwner whenNotStarted {
        require(
            token.transfer(to, amount),
            "LudoArena: rescue transfer failed"
        );
    }
}
