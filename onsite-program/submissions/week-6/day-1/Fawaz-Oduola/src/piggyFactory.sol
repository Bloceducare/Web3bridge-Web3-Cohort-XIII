// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "./piggy.sol";

contract PiggyFactory {
    mapping(address user => address[] accounts) userToAccounts;
    address admin;

    constructor (){
        admin = msg.sender;
    }

    receive() external payable{}

    function createAccount(uint256 _duration) external {
        PiggyBank piggyBank = new PiggyBank(msg.sender, _duration, admin);
        userToAccounts[msg.sender].push(address(piggyBank));
    }



    function getUserAccounts(address _user) external view returns (address[] memory){
        return userToAccounts[_user];
    }
}
