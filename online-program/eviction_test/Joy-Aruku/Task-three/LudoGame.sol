// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract LudoGame is VRFConsumerBaseV2Plus {
    IERC20 public token;
    address public owners;
    uint256 public stakeAmount;

    enum COLOR { RED, BLUE, GREEN, YELLOW }
    enum GameState { JOIN, PLAY, FINISH }

    struct Player {
        address wallet;
        COLOR color;
        uint8 position;
        string name;
        uint256 score;
    }

    uint8 public constant MAX_PLAYERS = 4;
    uint8 public constant MIN_PLAYERS = 2;
    uint8 public constant BOARD_END = 30;
    
    uint256 s_subscriptionId;
    address vrfCoordinator = 0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B;
    bytes32 s_keyHash = 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;
    uint32 callbackGasLimit = 40000;
    uint16 requestConfirmations = 3;
    uint32 numWords = 1;

    GameState public gameState;
    Player[] public players;
    uint256 public totalStaked;
    address public currentPlayer;
    bool public isRolling;
    address public winner;

    mapping(uint256 => address) public diceRequests;
    mapping(address => bool) public hasJoined;

    constructor(address _token, uint256 _stakeAmount, uint256 subscriptionId) 
        VRFConsumerBaseV2Plus(vrfCoordinator) {
        token = IERC20(_token);
        stakeAmount = _stakeAmount;
        owners = msg.sender;
        gameState = GameState.JOIN;
        s_subscriptionId = subscriptionId;
    }


    function joinGame(string memory name, COLOR color) external {
        require(gameState == GameState.JOIN, "Wrong state");
        require(!hasJoined[msg.sender], "Already joined");
        require(players.length < MAX_PLAYERS, "Game full");

        require(token.transferFrom(msg.sender, address(this), stakeAmount), "Payment failed");
        
        players.push(Player({
            wallet: msg.sender,
            color: color,
            position: 0,
            name: name,
            score: 0
        }));
        
        hasJoined[msg.sender] = true;
        totalStaked += stakeAmount;
    }

    function startGame() external onlyOwner {
        require(gameState == GameState.JOIN, "Wrong state");
        require(players.length >= MIN_PLAYERS, "Need more players");
        
        gameState = GameState.PLAY;
        currentPlayer = players[0].wallet;
    }

    function rollDice() external {
        require(gameState == GameState.PLAY, "Wrong state");
        require(msg.sender == currentPlayer, "Not your turn");
        require(!isRolling, "Already rolling");

        isRolling = true;
        
        uint256 requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: s_keyHash,
                subId: s_subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: true})
                )
            })
        );
        
        diceRequests[requestId] = msg.sender;
    }

    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override {
        address player = diceRequests[requestId];
        require(player != address(0), "Bad request");

        uint8 dice = uint8(randomWords[0] % 6) + 1;
        
        for(uint i = 0; i < players.length; i++) {
            if(players[i].wallet == player) {
                players[i].position += dice;
                players[i].score += dice;
                
                if(players[i].position >= BOARD_END) {
                    players[i].position = BOARD_END;
                    gameState = GameState.FINISH;
                    winner = player;
                    token.transfer(winner, totalStaked);
                    resetGame();
                } else {
                    nextTurn();
                }
                break;
            }
        }
        
        isRolling = false;
    }

    function nextTurn() private {
        for(uint i = 0; i < players.length; i++) {
            if(players[i].wallet == currentPlayer) {
                if(i == players.length - 1) {
                    currentPlayer = players[0].wallet;
                } else {
                    currentPlayer = players[i+1].wallet;
                }
                return;
            }
        }
    }

    function resetGame() private {
        for(uint i = 0; i < players.length; i++) {
            hasJoined[players[i].wallet] = false;
        }
        delete players;
        totalStaked = 0;
        currentPlayer = address(0);
        gameState = GameState.JOIN;
    }

    function getPlayers() external view returns (Player[] memory) {
        return players;
    }
}