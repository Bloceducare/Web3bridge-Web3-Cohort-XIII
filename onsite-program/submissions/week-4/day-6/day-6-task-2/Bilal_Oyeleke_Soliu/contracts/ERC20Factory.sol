// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { ERC20Token } from "./ERC20.sol";

contract ERC20Factory {
    address[] public deployedERC20Tokens;
    event TokenCreated(address indexed tokenAddress, string name, string symbol);
    string public tokenName;
    string public tokenSymbol;
    uint8 public tokenDecimals;
    address public owner;

    constructor(string memory _name, string memory _symbol, uint8 _decimal) {
        tokenName = _name;
        tokenSymbol = _symbol;
        tokenDecimals = _decimal;
        owner = msg.sender;
    }

    function createToken() public {
        ERC20Token newToken = new ERC20Token(tokenName, tokenSymbol, tokenDecimals, owner);
        address newTokenAddress = address(newToken);
        deployedERC20Tokens.push(newTokenAddress);
        emit TokenCreated(newTokenAddress, tokenName, tokenSymbol);
    }

    function getDeployedTokens() public view returns (address[] memory) {
        return deployedERC20Tokens;
    }
}