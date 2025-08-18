// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

enum ColorType {
    RED,
    GREEN,
    BLUE,
    YELLOW
}

error MaximumUserReached();
error InvalidName();
error PlayerNotFound();
error ColorAlreadyTaken();
error Only_owner_required();

contract Ludo {
    struct LudoUser {
        string name;
        uint256 score;
        uint256 position;
        ColorType color;
        address playerAddress;
    }

    LudoUser[] public players;
    address public owner;
    mapping(ColorType => bool) private colorTaken;
    uint256 public constant MAX_PLAYERS = 4;

    event UserCreated(address indexed playerAddress, string name, ColorType color);
    event ScoreUpdated(address indexed playerAddress, uint256 newScore);
    event DiceRolled(address indexed player, uint256 roll);
    event PlayerMoved(address indexed player, uint256 newPosition);

    modifier onlyOwner() {
      if(msg.sender != owner) revert Only_owner_required();
      _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createUser(string memory _name, uint256 _score, ColorType _color) external {
      if (bytes(_name).length == 0) revert InvalidName();
      if (players.length >= MAX_PLAYERS) revert MaximumUserReached();
      if (colorTaken[_color]) revert ColorAlreadyTaken();

      LudoUser memory newUser = LudoUser({
          name: _name,
          score: _score,
          position: 0,
          color: _color,
          playerAddress: msg.sender
      });

      players.push(newUser);
      colorTaken[_color] = true;

      emit UserCreated(msg.sender, _name, _color);
    }

    function getPlayer(address _playerAddress) external view returns (LudoUser memory) {
      for (uint256 i = 0; i < players.length; i++) {
          if (players[i].playerAddress == _playerAddress) {
              return players[i];
          }
      }
      revert PlayerNotFound();
    }

    function updateScore(address _playerAddress, uint256 _newScore) external onlyOwner {
      for (uint256 i = 0; i < players.length; i++) {
          if (players[i].playerAddress == _playerAddress) {
              players[i].score = _newScore;
              emit ScoreUpdated(_playerAddress, _newScore);
              return;
          }
      }
      revert PlayerNotFound();
    }

    function rollDice() public view returns (uint256) {
        uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender))) % 6 + 1;
        return random;
    }

    function makeMove() external {
      uint256 dice = rollDice();
      for (uint256 i = 0; i < players.length; i++) {
          if (players[i].playerAddress == msg.sender) {
              players[i].position += dice;
              emit DiceRolled(msg.sender, dice);
              emit PlayerMoved(msg.sender, players[i].position);
              return;
          }
      }
      revert PlayerNotFound();
    }

    function resetGame() external onlyOwner {
      for (uint256 i = 0; i < players.length; i++) {
          colorTaken[players[i].color] = false;
      }
      delete players; 
    }

    function getAllPlayers() external view returns (LudoUser[] memory) {
      return players;
    }
}
