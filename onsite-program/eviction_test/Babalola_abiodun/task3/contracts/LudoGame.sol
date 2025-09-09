// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;
import "./GameToken.sol"
contract LudoGame {
    enum COLORS{
        RED,GREEN,BLUE,YELLOW
    }
    struct User{
        string name ;
        address userAddress;
        Color color;
        uint stake; 
    }

    struct Game{
        User[] gamePlayers ;
        uint winnerIndex;
    }
    GameToken ludoToken ;
    constructor(address tokenAddress){
        ludoToken = GameToken(tokenAddress);     
    } 
    mapping ( uint => Game ) allGames;
    uint private Counter = 1;   
    function joinGame(string memory _name,Color _color, uint stakingAmout) external returns(User memory ){ 
        require(ludoToken.balanceOf(msg.sender)>= stakingAmout,"Insufficient token balance");
        ludoToken.approve(); 
        User user = User({name : _name, userAddress: msg.sender, color: _color });
        
        
    }
}