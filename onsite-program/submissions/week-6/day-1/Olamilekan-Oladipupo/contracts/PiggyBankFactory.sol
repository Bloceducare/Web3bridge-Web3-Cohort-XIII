// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "./PiggyBank.sol";


contract PiggyBankFactory {

    address [] addresses;
    address owner;
    address tokenAddress;
    constructor (address _tokenAddress) {
        owner = msg.sender;
        tokenAddress = _tokenAddress;
    }

    function createPiggyBank () external  {
    
        PiggyBank piggyBank = new PiggyBank(tokenAddress, owner);
        address myPiggyAddress = address(piggyBank);
        addresses.push(myPiggyAddress);
    }

    function getAddresses () external view returns (address [] memory) {
        return addresses;
    } 
}