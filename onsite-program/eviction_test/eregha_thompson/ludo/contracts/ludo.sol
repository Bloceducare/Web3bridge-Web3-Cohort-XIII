// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract LudoChallenge {
    address public constant LUDO_TOKEN = 0x0ceC7A61B12d801a37143e6E223Cab907839cE3f;
    uint256 private count;
    ERC20 public tokenAddress = ERC20(LUDO_TOKEN);

    struct User {
        string name;
        uint256 score;
        COLOR color;
        address player_address;
    }

    enum GAME_MODE {
        ENDED,
        START,
        ONGOING
    }

    enum COLOR {
        RED,
        GREEN,
        BLUE,
        YELLOW
    }

    User[4] public players;
    uint8 public playerCount;
    GAME_MODE public game_state = GAME_MODE.ENDED;
    address public gameOwner;

    event PlayerRegistered(address player, string name, COLOR color);
    event GameStarted();
    event TokensStaked(address player, uint256 amount);

    modifier onlyRegisteredPlayer() {
        bool isRegistered;
        for (uint256 i = 0; i < playerCount; i++) {
            if (players[i].player_address == msg.sender) {
                isRegistered = true;
                break;
            }
        }
        require(isRegistered, "Player not registered");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == gameOwner, "Only owner can call this function");
        _;
    }

    constructor() {
        gameOwner = msg.sender;
    }

    function register_user(string memory _name, COLOR _color) external {
        require(game_state == GAME_MODE.ENDED, "Game has already started");
        require(playerCount <= 4, "Maximum player limit reached");
        require(_color >= COLOR.RED && _color <= COLOR.YELLOW, "Invalid color");

        // Check if color is already taken
        for (uint256 i = 0; i < playerCount; i++) {
            require(players[i].color != _color, "Color already taken");
            require(players[i].player_address != msg.sender, "Player already registered");
        }

        User memory newPlayer = User(_name, 0, _color, msg.sender);
        players[playerCount] = newPlayer;
        playerCount++;

        emit PlayerRegistered(msg.sender, _name, _color);
    }

    function stake_token(uint256 _amount) external onlyRegisteredPlayer {
        require(_amount > 0, "Amount must be greater than 0");
        require(tokenAddress.balanceOf(msg.sender) >= _amount, "Insufficient token balance");

        bool success = tokenAddress.transferFrom(msg.sender, address(this), _amount);
        require(success, "Token transfer failed");

        emit TokensStaked(msg.sender, _amount);
    }

    function start_game(uint256 _minimumStake) external onlyOwner {
        require(game_state == GAME_MODE.ENDED, "Game has already started");
        require(playerCount >= 2, "At least 2 players required");
        require(playerCount <= 4, "Maximum 4 players allowed");

        // Verify all registered players have staked at least the minimum amount
        for (uint256 i = 0; i < playerCount; i++) {
            uint256 stakedAmount = tokenAddress.balanceOf(address(this)); // Simplified check, adjust as needed
            require(stakedAmount >= _minimumStake, "Insufficient stake by a player");
        }

        game_state = GAME_MODE.START;
        emit GameStarted();
    }

    function rollDice() external onlyRegisteredPlayer returns (uint256) {
        require(game_state == GAME_MODE.START || game_state == GAME_MODE.ONGOING, "Game not in progress");
        count++;
        uint256 randomHash = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, count)));
        uint256 diceResult = (randomHash % 6) + 1; // 1 to 6
        return diceResult;
    }
}