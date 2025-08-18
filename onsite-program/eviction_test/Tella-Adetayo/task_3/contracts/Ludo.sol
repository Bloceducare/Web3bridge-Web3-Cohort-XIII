// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Ludo is ERC20 {

    enum Color { RED, GREEN, YELLOW, BLUE }

    struct Player {
        IERC20 milgToken;
        string name;
        uint256 score;
        Color color;
    }

    Player[] public players;
    mapping(address => Player) public eachPlayer;
    mapping(address => uint256) public playerBalance;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not allowed");
        _;
    }

    error MAXIMUM_NUMBER_OF_PLAYERS_REACHED();
    error ACCOUNT_DOES_NOT_EXIST();
    error MINIMUM_AMOUNT_NEEDED_IS_1();

    address public owner;

    constructor() ERC20("MadeInLagosGame", "MILG") {
        owner = msg.sender;
    }

    function mintTokens(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
        playerBalance[to] += amount;
    }

    // Register a player
    function registerPlayer(string memory _name, uint256 _score, Color _color) external {
        if (players.length >= 4) {
            revert MAXIMUM_NUMBER_OF_PLAYERS_REACHED();
        }

        if (bytes(eachPlayer[msg.sender].name).length != 0) {
            revert("Player already registered");
        }

        Player memory player = Player(IERC20(address(this)), _name, _score, _color);

        players.push(player);
        eachPlayer[msg.sender] = player;
    }

    // Fund a player with MILG tokens
    function fundPlayer(address _account, uint256 _amount) external {
        if (_amount < 1) {
            revert MINIMUM_AMOUNT_NEEDED_IS_1();
        }

        _mint(_account, _amount);
        playerBalance[_account] += _amount;
    }

    // Get a player's balance
    function getPlayerBalance(address _account) external view returns (uint256) {
        return playerBalance[_account];
    }

    // Get a player's details
    function getPlayer(address _account) public view returns (Player memory) {
        Player memory player = eachPlayer[_account];
        if (bytes(player.name).length == 0) {
            revert ACCOUNT_DOES_NOT_EXIST();
        }
        return player;
    }

    // Get all players
    function getPlayers() external view returns (Player[] memory) {
        return players;
    }

    // Private function to roll a dice (1-6)
    function rollDice() private view returns (uint256) {
        // Simple pseudo-random using blockhash and sender
        return (uint256(keccak256(abi.encodePacked(blockhash(block.number - 1), msg.sender, block.timestamp))) % 6) + 1;
    }

    // The game 
    function playDiceGame(uint256 _betAmount) external {
        Player storage player = eachPlayer[msg.sender];
        if (bytes(player.name).length == 0) {
            revert ACCOUNT_DOES_NOT_EXIST();
        }

        require(playerBalance[msg.sender] >= _betAmount, "Insufficient balance");

        uint256 dice1 = rollDice();
        uint256 dice2 = rollDice();
        uint256 total = dice1 + dice2;

        if (total >= 10 && total <= 12) {
            // Win: increase balance
            playerBalance[msg.sender] += _betAmount;
        } else {
            // Lose: decrease balance
            playerBalance[msg.sender] -= _betAmount;
        }
    }
}
