// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Lottery {
 
  address[] players;
  mapping(address=>bool) inGame;

  event PlayerJoined(address player);

  constructor() payable {
    
  }


  function joinLottery() external payable {
    require(msg.value == 0.01 ether, "Pay exactly 0.01 ether to join lottery" );
    require(!inGame[msg.sender], "Already in game");
    players.push(msg.sender);
    inGame[msg.sender] = true;
    emit PlayerJoined(msg.sender);

    if(players.length>=10){

    }
  }

  function pickWinner(uint256 _random) private view returns(address) {
    uint256 winnerIndex = _random % 10;
    return players[winnerIndex];
  }  

  

  
}
