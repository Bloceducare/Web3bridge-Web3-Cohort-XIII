// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./ERC20Token.sol";

contract Factory {
    address[] public tokenAddresses;

    address owner;


    constructor() {
        owner = msg.sender;
    }

    function createToken() public {

        ERC20Token newToken = new ERC20Token();

        address takeToken = address(newToken);

        tokenAddresses.push(takeToken);

    }

    function getAllTokens() public view returns (address[] memory) {
        return tokenAddresses;
    }
}