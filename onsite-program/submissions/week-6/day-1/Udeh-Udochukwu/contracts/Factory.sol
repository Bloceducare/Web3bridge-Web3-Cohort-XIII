// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./Piggy.sol";

contract Factory {
      address public admin;
    
    mapping(address => address[]) public userPiggyBanks;
    
    
    
    constructor() {
        admin = msg.sender;
    }
    
    function createPiggyBank(uint _unlockTime, address _tokenAddress) external payable {
        Piggy newPiggy = new Piggy{value: msg.value}(_unlockTime, payable(admin), _tokenAddress);
        
        userPiggyBanks[msg.sender].push(address(newPiggy));
    }

    function getUserPiggyBanks(address _user) external view returns (address[] memory) {
        return userPiggyBanks[_user] ;
    }

    function getMyPiggyBanks() external view returns (address[] memory) {
        return userPiggyBanks[msg.sender];
    }
      
}