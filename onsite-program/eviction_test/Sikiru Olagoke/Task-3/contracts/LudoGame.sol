// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
 import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
contract LudoGame {
 address ludoToken = 0x7484A11cd0F80E895DeCA919a61abfAc5AE88F9c;
uint256 private count;
 ERC20 tokenAddy = ERC20(ludoToken);

  struct User {
    string name;
    uint256 score;
    COLOR color;
    address player_addy;
  }

  enum GAME_STATE {
    START,
    ONGOING,
    ENDED
  }



  enum COLOR {
    RED,
    GREEN,
    BLUE,
    YELLOW
  }

  User[4] players;
  GAME_STATE game_state = GAME_STATE.ENDED;

  function register_user(string memory _name, COLOR _color) external {
    for(uint256 i; i < players.length; i++) {
      if(players[i].player_addy != msg.sender) {
        
      User memory player_ = User(_name, 0, _color, msg.sender);
         players[i] = (player_);
      }
    }

  }

  function stake_token(uint256 _amount) internal {
    
    for(uint256 i; i < players.length; i++) {
      if(players[i].player_addy == msg.sender) {
        tokenAddy.transfer(address(this), _amount);
        return;
      }
    }
  }

  function start_game(uint256 _amount) external {
    if(game_state == GAME_STATE.ENDED) {
        game_state = GAME_STATE.START;


    }


  }

  function rollDice() public returns (uint256) {
        count++;
        uint256 randomHash = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, count)));
        uint256 diceResult = (randomHash % 6) + 1; // 1 to 6
        return diceResult;
    }
  



}
