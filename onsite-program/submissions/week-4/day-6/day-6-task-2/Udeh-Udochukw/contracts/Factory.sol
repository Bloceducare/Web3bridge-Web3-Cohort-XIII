// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.26;

import "./ERC20.sol";


contract ERC20Factory {
    event TokenCreated(address indexed tokenAddress, address indexed creator);

    address[] public deployedTokens;

    function createToken(
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) external returns (address) {
        ERC20 newToken = new ERC20(_name, _symbol, _decimals);
        address tokenAddress = address(newToken);
        
        deployedTokens.push(tokenAddress);
        
        emit TokenCreated(tokenAddress, msg.sender);
        
        return tokenAddress;
    }

    function getDeployedTokens() external view returns (address[] memory) {
        return deployedTokens;
    }

    function getDeployedTokensCount() external view returns (uint256) {
        return deployedTokens.length;
    }
}