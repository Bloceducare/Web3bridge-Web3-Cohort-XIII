// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IERC20 as OZIERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LudoGame is Ownable, ReentrancyGuard {
    enum Color { RED, GREEN, BLUE, YELLOW }

    struct Player {
        address account;
        string name;
        uint256 score; // position on track
        Color color;
        bool registered;
        bool staked;
    }

    // Config
    OZIERC20 public immutable token; // staking token
    uint256 public immutable stakeAmount; // tokens required to join
    uint256 public immutable targetScore; // finish line (e.g., 30)

    // Game state
    Player[4] public players; // max 4 players
    uint256 public playersCount;
    mapping(address => uint256) public playerIndexOf; // 1-based index; 0 means not present
    bool[4] public colorTaken; // one per Color enum

    enum Phase { Registering, Started, Ended }
    Phase public phase;

    uint256 public turnIndex; // 0..playersCount-1
    address public winner;
    uint256 public pot; // total staked tokens inside contract

    // Randomness helper
    uint256 private nonce;

    // Events
    event PlayerRegistered(address indexed player, string name, Color color);
    event Staked(address indexed player, uint256 amount);
    event GameStarted();
    event DiceRolled(address indexed player, uint256 dice, uint256 newScore);
    event WinnerDeclared(address indexed winner, uint256 pot);

    error InvalidPhase();
    error AlreadyRegistered();
    error ColorAlreadyTaken();
    error MaxPlayersReached();
    error NotAPlayer();
    error NotPlayersTurn();
    error NotEnoughPlayers();
    error NotAllStaked();

    constructor(OZIERC20 _token, uint256 _stakeAmount, uint256 _targetScore) Ownable(msg.sender) {
        require(address(_token) != address(0), "token=0");
        require(_stakeAmount > 0, "stake=0");
        require(_targetScore > 0, "target=0");
        token = _token;
        stakeAmount = _stakeAmount;
        targetScore = _targetScore;
        phase = Phase.Registering;
    }

    function getPlayers() external view returns (Player[4] memory list, uint256 count) {
        return (players, playersCount);
    }

    function registerPlayer(string calldata name, Color color) external {
        if (phase != Phase.Registering) revert InvalidPhase();
        if (playersCount == 4) revert MaxPlayersReached();
        if (playerIndexOf[msg.sender] != 0) revert AlreadyRegistered();
        if (colorTaken[uint256(color)]) revert ColorAlreadyTaken();

        players[playersCount] = Player({
            account: msg.sender,
            name: name,
            score: 0,
            color: color,
            registered: true,
            staked: false
        });
        playersCount += 1;
        colorTaken[uint256(color)] = true;
        playerIndexOf[msg.sender] = playersCount; // 1-based index

        emit PlayerRegistered(msg.sender, name, color);
    }

    function stake() external {
        if (phase != Phase.Registering) revert InvalidPhase();
        uint256 idx1 = playerIndexOf[msg.sender];
        if (idx1 == 0) revert NotAPlayer();
        uint256 idx = idx1 - 1;
        Player storage p = players[idx];
        require(!p.staked, "already staked");

        // pull tokens from player
        bool ok = token.transferFrom(msg.sender, address(this), stakeAmount);
        require(ok, "transferFrom failed");
        p.staked = true;
        pot += stakeAmount;
        emit Staked(msg.sender, stakeAmount);
    }

    function startGame() external {
        if (phase != Phase.Registering) revert InvalidPhase();
        if (playersCount < 2) revert NotEnoughPlayers();
        // Ensure all registered players have staked
        for (uint256 i = 0; i < playersCount; i++) {
            if (!players[i].staked) revert NotAllStaked();
        }
        phase = Phase.Started;
        turnIndex = 0; // first registered starts
        emit GameStarted();
    }

    function currentPlayer() public view returns (address) {
        if (phase != Phase.Started) return address(0);
        return players[turnIndex].account;
    }

    function rollDiceAndMove() external nonReentrant {
        if (phase != Phase.Started) revert InvalidPhase();
        if (playerIndexOf[msg.sender] == 0) revert NotAPlayer();
        if (players[turnIndex].account != msg.sender) revert NotPlayersTurn();

        uint256 dice = _rollDice(msg.sender);
        Player storage p = players[turnIndex];
        p.score += dice;
        emit DiceRolled(msg.sender, dice, p.score);

        if (p.score >= targetScore) {
            // Winner!
            winner = msg.sender;
            phase = Phase.Ended;
            uint256 prize = pot;
            pot = 0;
            bool ok = token.transfer(msg.sender, prize);
            require(ok, "prize transfer failed");
            emit WinnerDeclared(msg.sender, prize);
            return;
        }

        // next turn
        turnIndex = (turnIndex + 1) % playersCount;
    }

    function _rollDice(address player) internal returns (uint256) {
        unchecked {
            nonce++;
        }
        uint256 randomness = uint256(
            keccak256(
                abi.encodePacked(block.timestamp, block.prevrandao, player, nonce)
            )
        );
        uint256 dice = (randomness % 6) + 1; // 1..6
        return dice;
    }
}
