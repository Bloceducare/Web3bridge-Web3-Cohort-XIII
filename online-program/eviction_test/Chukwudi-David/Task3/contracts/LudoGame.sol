// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LudoGame {
    enum Color { NONE, RED, GREEN, BLUE, YELLOW }

    struct Player {
        address addr;
        string name;
        Color color;
        uint8 position;
        uint8 score;
        bool registered;
        bool finished;
    }

    IERC20 public stakeToken;
    uint256 public stakeAmount;
    uint8 public maxPlayers = 4;
    uint8 public goalPosition; // how many steps to win
    bool public started;
    uint8 public currentTurnIndex;
    address[] public playerOrder;
    mapping(address => Player) public players;
    mapping(Color => bool) public colorTaken;
    uint256 public totalStaked;
    address public winner;

    // Randomness seed (owner-settable for tests only)
    uint256 public seed;

    event PlayerRegistered(address indexed player, string name, Color color);
    event GameStarted();
    event DiceRolled(address indexed player, uint8 dice, uint8 newPosition);
    event PlayerFinished(address indexed player);
    event WinnerDeclared(address indexed winner, uint256 prize);

    modifier onlyRegistered() {
        require(players[msg.sender].registered, "Not registered");
        _;
    }

    modifier onlyActive() {
        require(started && winner == address(0), "Game not active");
        _;
    }

    constructor(address _stakeToken, uint256 _stakeAmount, uint8 _goalPosition, uint256 _seed) {
        stakeToken = IERC20(_stakeToken);
        stakeAmount = _stakeAmount;
        goalPosition = _goalPosition;
        seed = _seed;
    }

    function register(string calldata name, Color color) external {
        require(!started, "Game already started");
        require(playerOrder.length < maxPlayers, "Max players reached");
        require(color != Color.NONE, "Invalid color");
        require(!colorTaken[color], "Color already taken");
        require(!players[msg.sender].registered, "Already registered");

        // transfer stake
        require(stakeToken.transferFrom(msg.sender, address(this), stakeAmount), "Stake transfer failed");
        totalStaked += stakeAmount;

        // register
        players[msg.sender] = Player({
            addr: msg.sender,
            name: name,
            color: color,
            position: 0,
            score: 0,
            registered: true,
            finished: false
        });
        playerOrder.push(msg.sender);
        colorTaken[color] = true;

        emit PlayerRegistered(msg.sender, name, color);
    }

    // Start game — require at least 2 players
    function startGame() external {
        require(!started, "Already started");
        require(playerOrder.length >= 2, "Need at least 2 players");
        started = true;
        currentTurnIndex = 0;
        emit GameStarted();
    }

    // Public dice roll function (player calls on their turn)
    function rollDice() external onlyRegistered onlyActive {
        require(playerOrder[currentTurnIndex] == msg.sender, "Not your turn");
        uint8 dice = _roll() ;
        _applyMove(msg.sender, dice);

        emit DiceRolled(msg.sender, dice, players[msg.sender].position);

        // If winner set during move, end. Otherwise rotate turn to next active player.
        if (winner == address(0)) {
            _advanceTurn();
        }
    }


    function _roll() internal view returns (uint8) {
        // Unsafe for production randomness; acceptable for tests & demo
        uint256 rand = uint256(keccak256(abi.encodePacked(seed, block.timestamp, block.prevrandao)));
        return uint8((rand % 6) + 1);
    }

    // Apply move and check finishing
    function _applyMove(address playerAddr, uint8 dice) internal {
        Player storage p = players[playerAddr];
        require(!p.finished, "Player already finished");

        uint16 newPos = uint16(p.position) + dice;
        if (newPos >= goalPosition) {
            p.position = goalPosition;
            p.finished = true;
            p.score += 1;
            emit PlayerFinished(playerAddr);

            // Winner is the first to reach goal (simple rule)
            if (winner == address(0)) {
                winner = playerAddr;
                // transfer prize
                require(stakeToken.transfer(winner, totalStaked), "Prize transfer failed");
                emit WinnerDeclared(winner, totalStaked);
                totalStaked = 0;
            }
        } else {
            p.position = uint8(newPos);
        }
    }

    // Advance to next player who hasn't finished
    function _advanceTurn() internal {
        uint8 len = uint8(playerOrder.length);
        for (uint8 i = 1; i <= len; i++) {
            uint8 nextIndex = (currentTurnIndex + i) % len;
            address candidate = playerOrder[nextIndex];
            if (!players[candidate].finished) {
                currentTurnIndex = nextIndex;
                return;
            }
        }
        // No active players left — no winner (shouldn't happen here)
    }


    function setSeed(uint256 _seed) external  {
        seed = _seed;
    }

    function getPlayers() external view returns (address[] memory) {
        return playerOrder;
    }

    function getPlayerInfo(address addr) external view returns (string memory name, Color color, uint8 position, uint8 score, bool finished) {
        Player storage p = players[addr];
        return (p.name, p.color, p.position, p.score, p.finished);
    }
}
