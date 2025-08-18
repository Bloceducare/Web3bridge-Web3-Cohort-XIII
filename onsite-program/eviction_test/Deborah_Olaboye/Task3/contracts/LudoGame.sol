// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LudoGame {
    enum Color { RED, GREEN, BLUE, YELLOW }
    
    struct Player {
        string name;
        uint256 score;
        Color color;
        bool isRegistered;
        uint256 position;
        bool active;
    }
    
    IERC20 public ludoToken;
    mapping(address => Player) public players;
    mapping(address => uint256) public stakes;
    address[] public playerAddresses;
    uint256 public constant MAX_PLAYERS = 4;
    uint256 public constant STAKE_AMOUNT = 5 * 10**18;
    address public winner;
    bool public gameEnded;
    
    event PlayerRegistered(address player, string name, Color color);
    event DiceRolled(address player, uint256 result);
    event MoveCompleted(address player, uint256 position);
    event GameEnded(address winner, uint256 totalStake);
    
    constructor(address _ludoToken) {
        ludoToken = IERC20(_ludoToken);
    }
    
    function register(string memory _name, Color _color) external {
        require(!players[msg.sender].isRegistered, "You're already in!");
        require(playerAddresses.length < MAX_PLAYERS, "Too many players!");
        require(!isColorTaken(_color), "Color already used!");
        require(ludoToken.balanceOf(msg.sender) >= STAKE_AMOUNT, "Not enough LUDO tokens!");
        require(ludoToken.transferFrom(msg.sender, address(this), STAKE_AMOUNT), "Stake failed!");
        
        players[msg.sender] = Player({
            name: _name,
            score: 0,
            color: _color,
            isRegistered: true,
            position: 0,
            active: true
        });
        stakes[msg.sender] = STAKE_AMOUNT;
        playerAddresses.push(msg.sender);
        
        emit PlayerRegistered(msg.sender, _name, _color);
    }
    
    function isColorTaken(Color _color) private view returns (bool) {
        for (uint256 i = 0; i < playerAddresses.length; i++) {
            if (players[playerAddresses[i]].color == _color) {
                return true;
            }
        }
        return false;
    }
    
    function rollDice() external {
        require(players[msg.sender].isRegistered, "Register first!");
        require(players[msg.sender].active, "You're out!");
        require(!gameEnded, "Game's over!");
        require(ludoToken.balanceOf(msg.sender) >= STAKE_AMOUNT, "Not enough LUDO tokens!");
        require(ludoToken.transferFrom(msg.sender, address(this), STAKE_AMOUNT), "Stake failed!");
        
        uint256 diceResult = (uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.number))) % 6) + 1;
        stakes[msg.sender] += STAKE_AMOUNT;
        
        emit DiceRolled(msg.sender, diceResult);
        completeMove(msg.sender, diceResult);
    }
    
    function completeMove(address _player, uint256 _diceResult) private {
        require(players[_player].isRegistered, "Player not found!");
        Player storage player = players[_player];
        player.position = (player.position + _diceResult) % 40;
        player.score += _diceResult;
        
        emit MoveCompleted(_player, player.position);
        checkWinner();
    }
    
    function checkWinner() private {
        if (gameEnded) return;
        
        address leadingPlayer = address(0);
        uint256 maxScore = 0;
        
        for (uint256 i = 0; i < playerAddresses.length; i++) {
            address playerAddr = playerAddresses[i];
            if (players[playerAddr].active && players[playerAddr].score > maxScore) {
                maxScore = players[playerAddr].score;
                leadingPlayer = playerAddr;
            }
        }
        
        if (maxScore >= 100) {
            winner = leadingPlayer;
            gameEnded = true;
            uint256 totalStake = 0;
            for (uint256 i = 0; i < playerAddresses.length; i++) {
                totalStake += stakes[playerAddresses[i]];
                players[playerAddresses[i]].active = false;
            }
            if (winner != address(0) && totalStake > 0) {
                require(ludoToken.transfer(winner, totalStake), "Winner payout failed!");
            }
            emit GameEnded(winner, totalStake);
        }
    }
    
    function getPlayer(address _player) external view returns (string memory name, uint256 score, Color color, uint256 position) {
        Player memory player = players[_player];
        require(player.isRegistered, "Player not registered");
        return (player.name, player.score, player.color, player.position);
    }
}