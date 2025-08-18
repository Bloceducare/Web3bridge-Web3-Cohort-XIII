// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

enum PieceColor {
    RED,
    GREEN,
    BLUE,
    YELLOW
}

error MaxPlayersReached();
error InvalidName();
error PlayerNotFound();
error ColorTaken();
error InsufficientStake();
error OnlyOwner();
error GameNotFinished();

interface IToken {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract SimpleLudo {
    struct Player {
        string name;
        uint256 position;
        PieceColor color;
        address playerAddress;
        uint256 stake;
    }

    Player[] public players;
    address public owner;
    IToken public token;
    mapping(PieceColor => bool) private colorTaken;
    uint256 public constant MAX_PLAYERS = 4;
    uint256 public constant STAKE_AMOUNT = 100 * 10**18; // 100 tokens (assuming 18 decimals)
    uint256 public constant BOARD_END = 50; // Simplified board size

    event PlayerRegistered(address indexed playerAddress, string name, PieceColor color);
    event DiceRolled(address indexed player, uint256 roll);
    event PlayerMoved(address indexed player, uint256 newPosition);
    event WinnerDeclared(address indexed winner, uint256 prize);

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    constructor(address _tokenAddress) {
        owner = msg.sender;
        token = IToken(_tokenAddress);
    }

    function registerPlayer(string memory _name, PieceColor _color) external {
        if (bytes(_name).length == 0) revert InvalidName();
        if (players.length >= MAX_PLAYERS) revert MaxPlayersReached();
        if (colorTaken[_color]) revert ColorTaken();
        
        // Check and transfer stake
        if (token.balanceOf(msg.sender) < STAKE_AMOUNT) revert InsufficientStake();
        require(token.transferFrom(msg.sender, address(this), STAKE_AMOUNT), "Stake transfer failed");

        Player memory newPlayer = Player({
            name: _name,
            position: 0,
            color: _color,
            playerAddress: msg.sender,
            stake: STAKE_AMOUNT
        });

        players.push(newPlayer);
        colorTaken[_color] = true;

        emit PlayerRegistered(msg.sender, _name, _color);
    }

    function rollDice() private view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender))) % 6 + 1;
    }

    function makeMove() external {
        for (uint256 i = 0; i < players.length; i++) {
            if (players[i].playerAddress == msg.sender) {
                uint256 dice = rollDice();
                players[i].position += dice;

                if (players[i].position >= BOARD_END) {
                    players[i].position = BOARD_END; // Cap at board end
                    emit PlayerMoved(msg.sender, players[i].position);
                    emit DiceRolled(msg.sender, dice);
                    declareWinner(msg.sender);
                    return;
                }

                emit DiceRolled(msg.sender, dice);
                emit PlayerMoved(msg.sender, players[i].position);
                return;
            }
        }
        revert PlayerNotFound();
    }

    function declareWinner(address _winner) private {
        uint256 prize = STAKE_AMOUNT * players.length;
        require(token.transfer(_winner, prize), "Prize transfer failed");
        emit WinnerDeclared(_winner, prize);
        resetGame();
    }

    function resetGame() public onlyOwner {
        for (uint256 i = 0; i < players.length; i++) {
            colorTaken[players[i].color] = false;
        }
        delete players;
    }

    function getPlayer(address _playerAddress) external view returns (Player memory) {
        for (uint256 i = 0; i < players.length; i++) {
            if (players[i].playerAddress == _playerAddress) {
                return players[i];
            }
        }
        revert PlayerNotFound();
    }

    function getAllPlayers() external view returns (Player[] memory) {
        return players;
    }
}

